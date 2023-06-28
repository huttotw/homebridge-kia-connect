import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { Platform } from './platform';
import { OneToTen, VehicleInfoList } from './kiaconnect/types';
import { KiaConnect } from './kiaconnect/client';

type Door = {
  id: string;
  name: string;
  onGet: () => CharacteristicValue;
  service: Service | null;
};

type Target = {
  lockState: CharacteristicValue;
};

interface Options {
  engineOnDuration: OneToTen;
  refreshInterval: number;
  targetTemperature: string;
}

const defaultOptions: Options = {
  engineOnDuration: 10,
  refreshInterval: 1000 * 60 * 60, // Every 1 hour
  targetTemperature: '68',
};

/**
 * Car
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Car {
  private current: VehicleInfo | null = null;
  private doors: Door[];
  private engine: Service;
  private lock: Service;
  private target: Target;

  constructor(
    private readonly platform: Platform,
    private readonly accessory: PlatformAccessory,
    private readonly kiaConnect: KiaConnect,
    private readonly name: string,
    private readonly vin: string,
    private readonly options: Options = {
      engineOnDuration: 10,
      refreshInterval: 1000 * 60 * 60, // Every 1 hour
      targetTemperature: '68',
    },
  ) {
    options = Object.assign(defaultOptions, options);

    // target indicate where we want each value to be. These are sane defaults.
    this.target = {
      lockState: 0,
    };

    // Setup general info about the car
    const info = this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation);
    info.setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kia');
    info.setCharacteristic(this.platform.Characteristic.SerialNumber, this.vin);
    info.setCharacteristic(this.platform.Characteristic.Name, this.name);

    // Setup the engine switch
    this.engine = this.accessory.getService('engine') ||
      this.accessory.addService(this.platform.Service.Switch, 'engine', this.vin);
    this.engine.setCharacteristic(this.platform.Characteristic.Name, 'Engine');
    this.engine.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    // Setup lock mechanism
    this.lock = this.accessory.getService('lock') ||
      this.accessory.addService(this.platform.Service.LockMechanism, 'lock', this.vin);
    this.lock.setCharacteristic(this.platform.Characteristic.Name, 'Door Locks');
    this.lock.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.getCurrentLockState.bind(this));
    this.lock.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.getTargetLockState.bind(this))
      .onSet(this.setTargetLockState.bind(this));

    // Setup door contact sensors
    this.doors = [
      {id: 'frontLeftDoor', name: 'Front Left Door', onGet: this.getFrontLeftContactSensorState, service: null},
      {id: 'frontRightDoor', name: 'Front Right Door', onGet: this.getFrontRightContactSensorState, service: null},
      {id: 'backLeftDoor', name: 'Back Left Door', onGet: this.getBackLeftContactSensorState, service: null},
      {id: 'backRightDoor', name: 'Back Right Door', onGet: this.getBackRightContactSensorState, service: null},
      {id: 'hood', name: 'Hood', onGet: this.getHoodContactSensorState, service: null},
      {id: 'trunk', name: 'Trunk', onGet: this.getTrunkContactSensorState, service: null},
    ];
    this.doors.forEach((door, i) => {
      const x = this.accessory.getService(door.id) ||
        this.accessory.addService(this.platform.Service.ContactSensor, door.id, `${this.vin}:${door.id}`);
      x.setCharacteristic(this.platform.Characteristic.Name, door.name);
      x.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .onGet(door.onGet.bind(this));

      this.doors[i].service = x;
    });

    // Setup battery sensor
    const battery = this.accessory.getService('battery') ||
      this.accessory.addService(this.platform.Service.Battery, 'battery', this.vin);
    battery.setCharacteristic(this.platform.Characteristic.Name, 'Battery');
    battery.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevel.bind(this));
    battery.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(this.getStatusBatteryLow.bind(this));
    battery.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(this.getChargingState.bind(this));

    // Setup external temperature sensor
    const externalTemperature = this.accessory.getService('externalTemperature') ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, 'externalTemperature', this.vin);
    externalTemperature.setCharacteristic(this.platform.Characteristic.Name, 'External Temperature');
    externalTemperature.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    // Setup occupancy sensor
    const occupancy = this.accessory.getService('occupancy') ||
      this.accessory.addService(this.platform.Service.OccupancySensor, 'occupancy', this.vin);
    occupancy.setCharacteristic(this.platform.Characteristic.Name, 'Engine On');
    occupancy.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
      .onGet(this.getOccupancyDetected.bind(this));

    this.startControlLoop();
  }

  private getBatteryLevel(): CharacteristicValue {
    if (!this.current) {
      return 0;
    }

    this.platform.log.info('getBatteryLevel:', this.current.batteryPercent);
    return this.current.batteryPercent;
  }

  private getChargingState(): CharacteristicValue {
    if (!this.current) {
      return 2; // NOT_CHARGEABLE
    }

    this.platform.log.info('getChargingState:', this.current.isEngineOn);
    return this.current.isEngineOn ? 1 : 0; // CHARGING : NOT_CHARGING
  }

  private getBackLeftContactSensorState(): CharacteristicValue {
    let state: number;
    if (!this.current) {
      state = 0; // CONTACT_DETECTED
    } else {
      state = this.current.areDoorsClosed.backLeft ? 0 : 1; // CONTACT_DETECTED : CONTACT_NOT_DETECTED
    }

    this.platform.log.info('getBackLeftContactSensorState:', state);
    return state;
  }

  private getBackRightContactSensorState(): CharacteristicValue {
    let state: number;
    if (!this.current) {
      state = 0; // CONTACT_DETECTED
    } else {
      state = this.current.areDoorsClosed.backRight ? 0 : 1; // CONTACT_DETECTED : CONTACT_NOT_DETECTED
    }

    this.platform.log.info('getBackRightContactSensorState:', state);
    return state;
  }

  private getCurrentLockState(): CharacteristicValue {
    let currentLockState: number;
    if (!this.current) {
      currentLockState = 3; // UNKNOWN
    } else {
      currentLockState = this.current.areDoorsLocked ? 1 : 0; // SECURED : UNSECURED
    }

    this.platform.log.info('getCurrentLockState:', currentLockState);
    return currentLockState;
  }

  private getCurrentTemperature(): CharacteristicValue {
    if (!this.current) {
      return 0;
    }

    this.platform.log.info('getCurrentTemperature:', this.current.exteriorTemperature);
    return this.current.exteriorTemperature;
  }

  private getHoodContactSensorState(): CharacteristicValue {
    let state: number;
    if (!this.current) {
      state = 0; // CONTACT_DETECTED
    } else {
      state = this.current.areDoorsClosed.hood ? 0 : 1; // CONTACT_DETECTED : CONTACT_NOT_DETECTED
    }

    this.platform.log.info('getHoodContactSensorState:', state);
    return state;
  }

  private getFrontLeftContactSensorState(): CharacteristicValue {
    let state: number;
    if (!this.current) {
      state = 0; // CONTACT_DETECTED
    } else {
      state = this.current.areDoorsClosed.frontLeft ? 0 : 1; // CONTACT_DETECTED : CONTACT_NOT_DETECTED
    }

    this.platform.log.info('getFrontLeftContactSensorState:', state);
    return state;
  }

  private getFrontRightContactSensorState(): CharacteristicValue {
    let state: number;
    if (!this.current) {
      state = 0; // CONTACT_DETECTED
    } else {
      state = this.current.areDoorsClosed.frontRight ? 0 : 1; // CONTACT_DETECTED : CONTACT_NOT_DETECTED
    }

    this.platform.log.info('getFrontRightContactSensorState:', state);
    return state;
  }

  private getOccupancyDetected(): CharacteristicValue {
    if (!this.current) {
      return 0;
    }

    this.platform.log.info('getOccupancyDetected:', this.current.isEngineOn);
    return this.current.isEngineOn ? 1 : 0; // OCCUPANCY_DETECTED : OCCUPANCY_NOT_DETECTED
  }

  private getStatusBatteryLow(): CharacteristicValue {
    if (!this.current) {
      return 0;
    }

    this.platform.log.info('getStatusBatteryLow:', this.current.isBatteryLow);
    return this.current.isBatteryLow ? 1 : 0; // BATTERY_LEVEL_LOW : BATTERY_LEVEL_NORMAL
  }

  private getTrunkContactSensorState(): CharacteristicValue {
    let state: number;
    if (!this.current) {
      state = 0; // CONTACT_DETECTED
    } else {
      state = this.current.areDoorsClosed.trunk ? 0 : 1; // CONTACT_DETECTED : CONTACT_NOT_DETECTED
    }

    this.platform.log.info('getTrunkContactSensorState:', state);
    return state;
  }

  private getOn() {
    this.platform.log.info('getOn: ', this.current?.isEngineOn);
    if (!this.current) {
      return false;
    }
    return this.current.isEngineOn;
  }

  private getTargetLockState() {
    this.platform.log.info('getTargetLockState: ', this.target.lockState);
    return this.target.lockState;
  }

  private async refresh() {
    const res = await this.kiaConnect.vehicleInfo(this.vin);
    this.platform.log.debug('Vehicle info:', res);
    const vehicleInfo = parseVehicleInfo(res);
    if (!vehicleInfo) {
      return null;
    }

    this.current = vehicleInfo;

    // Update charactereistics
    this.engine.updateCharacteristic(this.platform.Characteristic.On, this.getOn());
    this.lock.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.getCurrentLockState());

    // Set the target state to the current state
    this.target.lockState = this.getCurrentLockState();
    this.lock.updateCharacteristic(this.platform.Characteristic.LockTargetState, this.getTargetLockState());

    // Set the door contact sensors
    this.doors.forEach(door => {
      door.service?.updateCharacteristic(this.platform.Characteristic.ContactSensorState, door.onGet.bind(this)());
    });
  }

  private async setOn(value: CharacteristicValue) {
    if (!this.current) {
      throw new Error('Not ready to start the engine');
    }

    let xid: string;
    if (value) {
      // Turn on the engine
      this.platform.log.info('Turning on the engine');
      xid = await this.kiaConnect.startClimate(this.vin, this.options.targetTemperature, this.options.engineOnDuration);
    } else {
      // Turn off the engine
      this.platform.log.info('Turning off the engine');
      xid = await this.kiaConnect.stopClimate(this.vin);
    }

    this.kiaConnect.waitForTransaction(this.vin, xid).then(this.refresh.bind(this));
  }

  private async setTargetLockState(value: CharacteristicValue) {
    let xid: string;
    if (value === 1) {
      // Lock the doors
      this.platform.log.info('Locking the doors');
      this.target.lockState = 1;
      xid = await this.kiaConnect.lock(this.vin);
    } else {
      // Unlock the doors
      this.platform.log.info('Unlocking the doors');
      this.target.lockState = 0;
      xid = await this.kiaConnect.unlock(this.vin);
    }

    this.kiaConnect.waitForTransaction(this.vin, xid).then(this.refresh.bind(this));
  }

  private async startControlLoop() {
    this.platform.log.info('Starting control loop', {
      refreshInterval: this.options.refreshInterval,
      vin: this.vin,
    });
    this.refresh();
    setInterval(this.refresh.bind(this), this.options.refreshInterval);
  }
}

type VehicleInfo = {
  areDoorsLocked: boolean;
  areDoorsClosed: {
    frontLeft: boolean;
    frontRight: boolean;
    hood: boolean;
    backLeft: boolean;
    backRight: boolean;
    trunk: boolean;
  };
  batteryPercent: number;
  exteriorTemperature: number;
  isAirOn: boolean;
  isBatteryLow: boolean;
  isEngineOn: boolean;
};

const parseVehicleInfo = (res: VehicleInfoList): VehicleInfo => {
  let exteriorTemperature: number;
  const tempC = res.lastVehicleInfo.weather.outsideTemp.find(t => t.unit === 0)?.value;
  if (!tempC) {
    exteriorTemperature = 0;
  } else {
    exteriorTemperature = parseInt(tempC, 10);
  }

  return {
    areDoorsClosed: {
      backLeft: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.backLeft === 0,
      backRight: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.backRight === 0,
      hood: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.hood === 0,
      frontLeft: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.frontLeft === 0,
      frontRight: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.frontRight === 0,
      trunk: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.trunk === 0,
    },
    areDoorsLocked: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorLock,
    batteryPercent: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.batteryStatus.stateOfCharge,
    exteriorTemperature,
    isAirOn: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airCtrl,
    isBatteryLow: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.batteryStatus.stateOfCharge
      < res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.batteryStatus.warning,
    isEngineOn: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.engine,
  };
};
