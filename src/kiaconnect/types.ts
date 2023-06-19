export type VehicleSummary = {
    vin: string;
    vehicleKey: string;
    vehicleIdentifier: string;
    modelName: string;
    modelYear: string;
    nickName: string;
    generation: number;
    extColorCode: string;
    trim: string;
    imagePath: {
      imageName: string;
      imagePath: string;
      imageType: string;
      imageSize: {
        length: string;
        width: string;
        uom: number;
      };
    };
    enrollmentStatus: number;
    fatcAvailable: number;
    telematicsUnit: number;
    fuelType: number;
    colorName: string;
    activationType: number;
    mileage: string;
    dealerCode: string;
    mobileStore: {
      osType: number;
      downloadURL: string;
      image: {
        imageName: string;
        imagePath: string;
        imageType: string;
        imageSize: {
          length: string;
          width: string;
          uom: number;
        };
      };
    }[];
    supportedApp: {
      appType: string;
      appImage: {
        imageName: string;
        imagePath: string;
        imageType: string;
        imageSize: {
          length: string;
          width: string;
          uom: number;
        };
      };
    };
    licensePlate: string;
    psi: string;
    supportAdditionalDriver: number;
    customerType: number;
    projectCode: string;
    headUnitDesc: string;
    provStatus: string;
    enrollmentSuppressionType: number;
    rsaStatus: number;
    notificationCount: number;
  };

export type LogInRequest = {
    userId: string;
    password: string;
};

export type LogInResponse = {
    status: {
        statusCode: number;
        errorType: number;
        errorCode: number;
        errorMessage: string;
    };
    payload: {
        vehicleSummary: {
            vin: string;
            vehicleIdentifier: string;
            modelName: string;
            modelYear: string;
            nickName: string;
            generation: number;
            extColorCode: string;
            trim: string;
            imagePath: {
                imageName: string;
                imagePath: string;
                imageType: string;
                imageSize: {
                    length: string;
                    width: string;
                    uom: number;
                };
            };
            enrollmentStatus: number;
            fatcAvailable: number;
            telematicsUnit: number;
            fuelType: number;
            colorName: string;
            activationType: number;
            mileage: string;
            dealerCode: string;
            mobileStore: {
                osType: number;
                downloadURL: string;
                image: {
                    imageName: string;
                    imagePath: string;
                    imageType: string;
                    imageSize: {
                        length: string;
                        width: string;
                        uom: number;
                    };
                };
            }[];
            supportedApp: {
                appType: string;
                appImage: {
                    imageName: string;
                    imagePath: string;
                    imageType: string;
                    imageSize: {
                        length: string;
                        width: string;
                        uom: number;
                    };
                };
            };
            licensePlate: string;
            psi: string;
            supportAdditionalDriver: number;
            customerType: number;
            projectCode: string;
            headUnitDesc: string;
            provStatus: string;
            enrollmentSuppressionType: number;
            rsaStatus: number;
            notificationCount: number;
            vehicleKey: string;
        }[];
        chatbotSupport: boolean;
    };
    sid: string;
};

export enum HeatVentType {
    Off = 0,
    Cool = 1,
    Heat = 2,
}

export enum HeatVentStep {
    Low = 0,
    Medium = 1,
    High = 2,
}

export enum HeatVentLevel {
    On = 3,
    Off = 1,
}

export interface RemoteClimateRequest {
    action: 'ACTION_EXEC_REMOTE_CLIMATE_ON';
    remoteClimate: {
      airTemp: {
        value: string;
        unit: 1;
      };
      airCtrl: boolean;
      defrost: boolean;
      ventilationWarning: boolean;
      ignitionOnDuration: {
        value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
        unit: 4;
      };
      heatingAccessory: {
        steeringWheel: unknown;
        sideMirror: unknown;
        rearWindow: unknown;
      };
      heatVentSeat: {
        driverSeat: {
          heatVentType: HeatVentType;
          heatVentLevel: HeatVentLevel;
          heatVentStep: HeatVentStep;
        };
        passengerSeat: {
          heatVentType: HeatVentType;
          heatVentLevel: HeatVentLevel;
          heatVentStep: HeatVentStep;
        };
        rearLeftSeat: {
          heatVentType: HeatVentType;
          heatVentLevel: HeatVentLevel;
          heatVentStep: HeatVentStep;
        };
        rearRightSeat: {
          heatVentType: HeatVentType;
          heatVentLevel: HeatVentLevel;
          heatVentStep: HeatVentStep;
        };
      };
    };
  }

export interface VehicleInfoResponse {
    status: Status;
    payload: Payload;
  }

export interface Status {
    statusCode: number;
    errorType: number;
    errorCode: number;
    errorMessage: string;
  }

export interface Payload {
    vehicleInfoList: VehicleInfoList[];
  }

export interface VehicleInfoList {
    vinKey: string;
    vehicleConfig: VehicleConfig;
    lastVehicleInfo: LastVehicleInfo;
  }

export interface VehicleConfig {
    vehicleDetail: VehicleDetail;
    maintenance: Maintenance;
    vehicleFeature: VehicleFeature;
    airTempRange: AirTempRange;
    heatVentSeat: HeatVentSeat;
    billingPeriod: BillingPeriod;
  }

export interface VehicleDetail {
    vehicle: Vehicle;
    images: Image[];
    device: Device;
  }

export interface Vehicle {
    vin: string;
    trim: Trim;
    telematics: number;
    mileage: string;
    mileageSyncDate: string;
    exteriorColor: string;
    exteriorColorCode: string;
    fuelType: number;
    invDealerCode: string;
    testVehicle: string;
    supportedApps: SupportedApp[];
    activationType: number;
  }

export interface Trim {
    modelYear: string;
    salesModelCode: string;
    optionGroupCode: string;
    modelName: string;
    factoryCode: string;
    projectCode: string;
    trimName: string;
    driveType: string;
    transmissionType: string;
    ivrCategory: string;
    btSeriesCode: string;
  }

export interface SupportedApp {
    appType: string;
    appImage?: AppImage;
  }

export interface AppImage {
    imageName: string;
    imagePath: string;
    imageType: string;
    imageSize: ImageSize;
  }

export interface ImageSize {
    length: string;
    width: string;
    uom: number;
  }

export interface Image {
    imageName: string;
    imagePath: string;
    imageType: string;
    imageSize: ImageSize2;
  }

export interface ImageSize2 {
    length: string;
    width: string;
    uom: number;
  }

export interface Device {
    launchType: string;
    swVersion: string;
    telematics: Telematics;
    versionNum: string;
    headUnitType: string;
    hdRadio: string;
    ampType: string;
    headUnitName: string;
    bluetoothRef: string;
    headUnitDesc: string;
  }

export interface Telematics {
    generation: string;
    platform: string;
    tmsCenter: string;
    billing: boolean;
  }

export interface Maintenance {
    nextServiceMile: number;
    maintenanceSchedule: number[];
  }

export interface VehicleFeature {
    remoteFeature: RemoteFeature;
    chargeFeature: ChargeFeature;
    alertFeature: AlertFeature;
    vrmFeature: VrmFeature;
    locationFeature: LocationFeature;
    userSettingFeature: UserSettingFeature;
  }

export interface RemoteFeature {
    lock: string;
    unlock: string;
    start: string;
    stop: string;
    scheduleCount: string;
    inVehicleSchedule: string;
    heatedSteeringWheel: string;
    heatedSideMirror: string;
    heatedRearWindow: string;
    heatedSeat: string;
    ventSeat: string;
    alarm: string;
    hornlight: string;
    panic: string;
    doorSecurity: string;
    rearOccupancyAlert: string;
    lowFuel: string;
    headLightTailLight: string;
    engineIdleTime: string;
    engineIdleStop: string;
    softwareUpdate: string;
    batteryDischarge: string;
    separateHeatedAccessories: string;
    windowSafety: string;
    comboCommand: string;
  }

export interface ChargeFeature {
    batteryChargeType: string;
    chargeEndPct: string;
    immediateCharge: string;
    cancelCharge: string;
    evRange: string;
    scheduleCount: string;
    inVehicleSchedule: string;
    offPeakType: string;
    scheduleType: string;
    chargeLevel: string;
    scheduleConfig: string;
    fatcWithCharge: string;
    evAlarmOption: string;
  }

export interface AlertFeature {
    geofenceType: GeofenceType;
    curfewType: CurfewType;
    speedType: SpeedType;
    valetType: ValetType;
  }

export interface GeofenceType {
    geofence: string;
    entryCount: string;
    exitCount: string;
    inVehicleConfig: string;
    minRadius: string;
    maxRadius: string;
    minHeight: string;
    maxHeight: string;
    minWidth: string;
    maxWidth: string;
    uom: string;
  }

export interface CurfewType {
    curfew: string;
    curfewCount: string;
    inVehicleConfig: string;
  }

export interface SpeedType {
    speed: string;
    speedCount: string;
    inVehicleConfig: string;
  }

export interface ValetType {
    valet: string;
    valetParkingMode: string;
    defaultRadius: string;
    defaultRadiusUnit: string;
    defaultInterval: string;
    defaultIntervalUnit: string;
    inVehicleConfig: string;
  }

export interface VrmFeature {
    autoDTC: string;
    scheduledDTC: string;
    backgroundDTC: string;
    manualDTC: string;
    healthReport: string;
    drivingScore: string;
    gasRange: string;
    evRange: string;
    trip: string;
  }

export interface LocationFeature {
    gpsStreaming: string;
    location: string;
    poi: string;
    poiCount: string;
    push2Vehicle: string;
    wayPoint: string;
    lastMile: string;
    mapType: string;
    surroundView: string;
    svr: string;
  }

export interface UserSettingFeature {
    usmType: string;
    vehicleOptions: string;
    systemOptions: string;
    additionalDriver: string;
    calendar: string;
    valetParkingMode: string;
    wifiHotSpot: string;
    otaSupport: string;
    digitalKeyOption: string;
    digitalStoreSupport: string;
  }

export interface AirTempRange {
    tempValueC: TempValueC[];
    tempValueF: TempValueF[];
  }

export interface TempValueC {
    displayOrder: number;
    tempValue: string;
  }

export interface TempValueF {
    displayOrder: number;
    tempValue: string;
  }

export interface HeatVentSeat {
    driverSeat: DriverSeat;
    passengerSeat: PassengerSeat;
    rearLeftSeat: RearLeftSeat;
    rearRightSeat: RearRightSeat;
  }

export interface DriverSeat {
    heatVentType: number;
    heatVentStep: number;
  }

export interface PassengerSeat {
    heatVentType: number;
    heatVentStep: number;
  }

export interface RearLeftSeat {
    heatVentType: number;
    heatVentStep: number;
  }

export interface RearRightSeat {
    heatVentType: number;
    heatVentStep: number;
  }

export interface BillingPeriod {
    freeTrial: FreeTrial;
    freeTrialExtension: FreeTrialExtension;
    servicePeriod: ServicePeriod;
  }

export interface FreeTrial {
    value: number;
    unit: number;
  }

export interface FreeTrialExtension {
    value: number;
    unit: number;
  }

export interface ServicePeriod {
    value: number;
    unit: number;
  }

export interface LastVehicleInfo {
    vehicleNickName: string;
    preferredDealer: string;
    licensePlate: string;
    psi: string;
    customerType: number;
    enrollment: Enrollment;
    activeDTC: ActiveDtc;
    vehicleStatusRpt: VehicleStatusRpt;
    location: Location;
    weather: Weather;
    financed: boolean;
    financeRegistered: boolean;
    linkStatus: number;
    rsaStatus: number;
  }

export interface Enrollment {
    provStatus: string;
    enrollmentStatus: string;
    enrollmentType: string;
    registrationDate: string;
    expirationDate: string;
    expirationMileage: string;
    freeServiceDate: FreeServiceDate;
  }

export interface FreeServiceDate {
    startDate: string;
    endDate: string;
  }

export interface ActiveDtc {
    dtcActiveCount: string;
  }

export interface VehicleStatusRpt {
    statusType: string;
    reportDate: ReportDate;
    vehicleStatus: VehicleStatus;
  }

export interface ReportDate {
    utc: string;
    offset: number;
  }

export interface VehicleStatus {
    climate: Climate;
    engine: boolean;
    doorLock: boolean;
    doorStatus: DoorStatus;
    lowFuelLight: boolean;
    ign3: boolean;
    transCond: boolean;
    distanceToEmpty: DistanceToEmpty;
    tirePressure: TirePressure;
    dateTime: DateTime;
    syncDate: SyncDate;
    batteryStatus: BatteryStatus;
    sleepMode: boolean;
    lampWireStatus: LampWireStatus;
    windowStatus: WindowStatus;
    smartKeyBatteryWarning: boolean;
    fuelLevel: number;
    washerFluidStatus: boolean;
    brakeOilStatus: boolean;
    engineOilStatus: boolean;
    engineRuntime: EngineRuntime;
    remoteControlAvailable: number;
    valetParkingMode: number;
    rsaStatus: number;
    lightStatus: LightStatus;
  }

export interface Climate {
    airCtrl: boolean;
    defrost: boolean;
    airTemp: AirTemp;
    heatingAccessory: HeatingAccessory;
    heatVentSeat: HeatVentSeat2;
  }

export interface AirTemp {
    value: string;
    unit: number;
  }

export interface HeatingAccessory {
    steeringWheel: number;
    sideMirror: number;
    rearWindow: number;
  }

export interface HeatVentSeat2 {
    driverSeat: DriverSeat2;
    passengerSeat: PassengerSeat2;
    rearLeftSeat: RearLeftSeat2;
    rearRightSeat: RearRightSeat2;
  }

export interface DriverSeat2 {
    heatVentType: number;
    heatVentLevel: number;
  }

export interface PassengerSeat2 {
    heatVentType: number;
    heatVentLevel: number;
  }

export interface RearLeftSeat2 {
    heatVentType: number;
    heatVentLevel: number;
  }

export interface RearRightSeat2 {
    heatVentType: number;
    heatVentLevel: number;
  }

export interface DoorStatus {
    frontLeft: number;
    frontRight: number;
    backLeft: number;
    backRight: number;
    trunk: number;
    hood: number;
  }

export interface DistanceToEmpty {
    value: number;
    unit: number;
  }

export interface TirePressure {
    all: number;
  }

export interface DateTime {
    utc: string;
    offset: number;
  }

export interface SyncDate {
    utc: string;
    offset: number;
  }

export interface BatteryStatus {
    stateOfCharge: number;
    deliveryMode: number;
    warning: number;
    powerAutoCutMode: number;
  }

export interface LampWireStatus {
    headLamp: HeadLamp;
    stopLamp: StopLamp;
    turnSignalLamp: TurnSignalLamp;
  }

export interface HeadLamp {
    headLampStatus: boolean;
    lampLL: boolean;
    lampRL: boolean;
    lampLH: boolean;
    lampRH: boolean;
    lampLB: boolean;
    lampRB: boolean;
  }

export interface StopLamp {
    leftLamp: boolean;
    rightLamp: boolean;
  }

export interface TurnSignalLamp {
    lampLF: boolean;
    lampRF: boolean;
    lampLR: boolean;
    lampRR: boolean;
  }

export interface WindowStatus {
    windowFL: number;
    windowFR: number;
    windowRL: number;
    windowRR: number;
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EngineRuntime = any;

export interface LightStatus {
    tailLampStatus: number;
    hazardStatus: number;
  }

export interface Location {
    coord: Coord;
    head: number;
    speed: Speed;
    accuracy: Accuracy;
    syncDate: SyncDate2;
  }

export interface Coord {
    lat: number;
    lon: number;
    alt: number;
    type: number;
    altdo: number;
  }

export interface Speed {
    value: number;
    unit: number;
  }

export interface Accuracy {
    hdop: number;
    pdop: number;
  }

export interface SyncDate2 {
    utc: string;
    offset: number;
  }

export interface Weather {
    outsideTemp: OutsideTemp[];
    weatherType: string;
    weatherImage: WeatherImage;
  }

export interface OutsideTemp {
    value: string;
    unit: number;
  }

export interface WeatherImage {
    imageName: string;
    imagePath: string;
    imageType: string;
    imageSize: ImageSize3;
  }

export interface ImageSize3 {
    length: string;
    width: string;
    uom: number;
  }
