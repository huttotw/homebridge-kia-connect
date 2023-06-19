import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { Platform } from './platform';
import { VehicleInfoList } from './kiaconnect/types';
import { KiaConnect } from './kiaconnect/client';
import {
  LockCurrentState,
  LockTargetState,
} from 'hap-nodejs/dist/lib/definitions';

type Target = {
  lockState: CharacteristicValue;
};
/**
 * Car
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Car {
  private target: Target;
  private engine: Service;
  private lock: Service;
  private current: VehicleInfo | null = null;

  constructor(
    private readonly platform: Platform,
    private readonly accessory: PlatformAccessory,
    private readonly kiaConnect: KiaConnect,
    private readonly name: string,
    private readonly targetTemperature: string,
    private readonly vin: string,
  ) {
    // target indicate where we want each value to be. These are sane defaults.
    this.target = {
      lockState: LockTargetState.SECURED,
    };

    // Setup general info about the car
    const info = this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kia');
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

    // TODO: make this get from the API.
    this.refresh();
    setInterval(this.refresh, 1000 * 60 * 60); // Every 60 minutes
  }

  private getCurrentLockState(): number {
    const currentLockState = this.current?.doorLock ? LockCurrentState.SECURED : LockCurrentState.UNSECURED;
    this.platform.log.info('getCurrentLockState:', currentLockState);
    return currentLockState;
  }

  private getOn(): boolean {
    this.platform.log.info('getOn: ', this.current?.engineStatus);
    if (!this.current) {
      return false;
    }
    return this.current.engineStatus;
  }

  private getTargetLockState() {
    this.platform.log.info('getTargetLockState: ', this.target.lockState);
    return this.target.lockState;
  }

  private async refresh() {
    this.platform.log.info('Refreshing vehicle info');
    const res = await this.kiaConnect.vehicleInfo(this.vin);
    this.platform.log.debug('Vehicle info:', res);
    const vehicleInfo = parseVehicleInfo(res);
    if (!vehicleInfo) {
      return null;
    }

    this.current = vehicleInfo;
    this.platform.log.debug('Resetting target values');
    this.target = {
      ...this.target,
      lockState: vehicleInfo.doorLock ? LockTargetState.SECURED : LockTargetState.UNSECURED,
    };
  }

  private async setOn(value: CharacteristicValue) {
    if (!this.current) {
      throw new Error('Not ready to start the engine');
    }

    let xid: string;
    if (value) {
      // Turn on the engine
      this.platform.log.info('Turning on the engine');
      xid = await this.kiaConnect.startClimate(this.vin, this.targetTemperature);
    } else {
      // Turn off the engine
      this.platform.log.info('Turning off the engine');
      xid = await this.kiaConnect.stopClimate(this.vin);
    }

    await this.kiaConnect.waitForTransaction(this.vin, xid);
    this.refresh();
  }

  private async setTargetLockState(value: CharacteristicValue) {
    let xid: string;
    if (value === LockCurrentState.SECURED) {
      // Lock the doors
      this.platform.log.info('Locking the doors');
      this.target.lockState = LockTargetState.SECURED;
      xid = await this.kiaConnect.lock(this.vin);
    } else {
      // Unlock the doors
      this.platform.log.info('Unlocking the doors');
      this.target.lockState = LockTargetState.UNSECURED;
      xid = await this.kiaConnect.unlock(this.vin);
    }

    await this.kiaConnect.waitForTransaction(this.vin, xid);
    this.refresh();
  }
}

type VehicleInfo = {
  vin: string;
  model: string;
  modelYear: string;
  name: string;
  trimName: string;
  exteriorColor: string;
  engineStatus: boolean;
  doorLock: boolean;
  fuelLevelPct: number;
  fuelLevelLow: boolean;
  batteryLevelPct: number;
  batteryLevelLow: boolean;
  temperature: number; // Celcius
  airCtrl: boolean;
  outsideTemp: number; // Celcius
};

const parseVehicleInfo = (res: VehicleInfoList): VehicleInfo => {
  const model = res.vehicleConfig.vehicleDetail.vehicle.trim.modelName;
  const modelYear = res.vehicleConfig.vehicleDetail.vehicle.trim.modelYear;
  const trimName = res.vehicleConfig.vehicleDetail.vehicle.trim.trimName;
  const fuelLevelPct = res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.fuelLevel;
  const batteryLevelPct = res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.batteryStatus.stateOfCharge;
  const temperatureValue = parseInt(res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airTemp.value, 10);
  const airCtrl = res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airCtrl;
  const outsideTemp = fToC(parseInt(res.lastVehicleInfo.weather.outsideTemp.find(val => val.unit === 1)?.value as string, 10));

  return {
    vin: res.vehicleConfig.vehicleDetail.vehicle.vin,
    model,
    modelYear,
    name: `KIA ${model} ${trimName} ${modelYear}`,
    trimName,
    exteriorColor: res.vehicleConfig.vehicleDetail.vehicle.exteriorColor,
    engineStatus: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.engine,
    doorLock: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorLock,
    fuelLevelPct,
    fuelLevelLow: fuelLevelPct < 10,
    batteryLevelPct,
    batteryLevelLow: batteryLevelPct <= res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.batteryStatus.warning,
    temperature: res.lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airTemp.unit === 1 ? fToC(temperatureValue) : temperatureValue,
    airCtrl,
    outsideTemp,
  };
};

const fToC = (f: number): number => {
  return (f - 32) * 5 / 9;
};
