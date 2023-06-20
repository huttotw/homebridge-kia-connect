import axios, { AxiosInstance } from 'axios';
import {
  HeatVentLevel,
  HeatVentStep,
  HeatVentType,
  LogInRequest,
  LogInResponse,
  RemoteClimateRequest,
  VehicleInfoList,
  VehicleInfoResponse,
  VehicleSummary,
} from './types';
import { URLSearchParams } from 'url';
import {backOff} from 'exponential-backoff';
import singleflight from 'node-singleflight';
import { Logger } from 'homebridge';

export class KiaConnect {
  axios: AxiosInstance;
  cookies?: string[];
  password: string;
  userId: string;
  vehicleKeys: Map<string, string> = new Map();
  lastLogin?: Date;

  constructor(userId: string, password: string, private readonly log: Logger) {
    this.axios = axios.create({withCredentials: true});
    this.password = password;
    this.userId = userId;
  }

  async getTransactionStatus(vin: string, xid: string): Promise<boolean> {
    await this.logIn({userId: this.userId, password: this.password});

    const requestJson = {
      xid,
      action: 'ACTION_GET_TRANSACTION_STATUS',
    };
    const query = new URLSearchParams();
    query.set('requestJson', JSON.stringify(requestJson));

    const res = await this.axios.get(
      `https://owners.kia.com/apps/services/owners/remotevehicledata?${query.toString()}`,
      {
        headers: {
          cookie: this.cookies?.join('; '),
          vinkey: this.vehicleKeys.get(vin),
        },
      },
    );

    this.log.debug('getTransactionStatus', res.data);

    // If the transaction is no longer being remotely executed...
    return res.data.payload.remoteStatus === 0;
  }

  async lock(vin: string): Promise<string> {
    await this.logIn({userId: this.userId, password: this.password});

    const requestJson = {
      action: 'ACTION_EXEC_REMOTE_LOCK_DOORS',
    };
    const query = new URLSearchParams();
    query.set('requestJson', JSON.stringify(requestJson));

    const res = await this.axios.get(
      `https://owners.kia.com/apps/services/owners/remotevehicledata?${query.toString()}`,
      {
        headers: {
          cookie: this.cookies?.join('; '),
          vinkey: this.vehicleKeys.get(vin),
        },
      },
    );

    this.log.debug('lock', res.data);

    return res.data.header.xid;
  }

  async unlock(vin: string): Promise<string> {
    await this.logIn({userId: this.userId, password: this.password});

    const requestJson = {
      action: 'ACTION_EXEC_REMOTE_UNLOCK_DOORS',
    };
    const query = new URLSearchParams();
    query.set('requestJson', JSON.stringify(requestJson));

    const res = await this.axios.get(
      `https://owners.kia.com/apps/services/owners/remotevehicledata?${query.toString()}`,
      {
        headers: {
          cookie: this.cookies?.join('; '),
          vinkey: this.vehicleKeys.get(vin),
        },
      },
    );

    this.log.debug('unlock', res.data);

    return res.data.header.xid;
  }

  async startClimate(vin: string, targetTempF: string): Promise<string> {
    await this.logIn({userId: this.userId, password: this.password});
    const req: RemoteClimateRequest = {
      action: 'ACTION_EXEC_REMOTE_CLIMATE_ON',
      remoteClimate: {
        airTemp: {
          value: targetTempF,
          unit: 1,
        },
        airCtrl: true,
        defrost: false,
        ventilationWarning: false,
        ignitionOnDuration: {
          value: 5,
          unit: 4,
        },
        heatingAccessory: {
          steeringWheel: 0,
          sideMirror: 0,
          rearWindow: 0,
        },
        heatVentSeat: {
          driverSeat: {
            heatVentType: HeatVentType.Off,
            heatVentLevel: HeatVentLevel.Off,
            heatVentStep: HeatVentStep.High,
          },
          passengerSeat: {
            heatVentType: HeatVentType.Off,
            heatVentLevel: HeatVentLevel.Off,
            heatVentStep: HeatVentStep.High,
          },
          rearLeftSeat: {
            heatVentType: HeatVentType.Off,
            heatVentLevel: HeatVentLevel.Off,
            heatVentStep: HeatVentStep.High,
          },
          rearRightSeat: {
            heatVentType: HeatVentType.Off,
            heatVentLevel: HeatVentLevel.Off,
            heatVentStep: HeatVentStep.High,
          },
        },
      },
    };

    const query = new URLSearchParams();
    query.set('requestJson', JSON.stringify(req));

    const res = await this.axios.get(`https://owners.kia.com/apps/services/owners/remotevehicledata?${query.toString()}`, {
      headers: {
        cookie: this.cookies?.join('; '),
        vinkey: this.vehicleKeys.get(vin),
      },
    });

    this.log.debug('startClimate', res.data);

    return res.data.header.xid;
  }

  async stopClimate(vin: string): Promise<string> {
    await this.logIn({userId: this.userId, password: this.password});

    const requestJson = {
      action: 'ACTION_EXEC_REMOTE_CLIMATE_OFF',
    };
    const query = new URLSearchParams();
    query.set('requestJson', JSON.stringify(requestJson));

    const res = await this.axios.get(
      `https://owners.kia.com/apps/services/owners/remotevehicledata?${query.toString()}`,
      {
        headers: {
          cookie: this.cookies?.join('; '),
          vinkey: this.vehicleKeys.get(vin),
        },
      });

    this.log.debug('stopClimate', res.data);

    return res.data.header.xid;
  }

  async vehicleInfo(vin: string): Promise<VehicleInfoList> {
    await this.logIn({userId: this.userId, password: this.password});

    const res = await this.axios.get(
      // eslint-disable-next-line max-len
      'https://owners.kia.com/apps/services/owners/getvehicleinfo.html/vehicle/1/maintenance/1/vehicleFeature/1/airTempRange/1/seatHeatCoolOption/1/enrollment/1/dtc/1/vehicleStatus/1/weather/1/location/1/dsAndUbiEligibilityInfo/1',
      {
        headers: {
          cookie: this.cookies?.join('; '),
          vinkey: this.vehicleKeys.get(vin),
        },
      },
    );

    this.log.debug('vehicleInfo', res.data);

    const data = res.data as VehicleInfoResponse;
    const info = data.payload.vehicleInfoList.find((info) => info.vehicleConfig.vehicleDetail.vehicle.vin === vin);
    if (!info) {
      throw new Error(`Could not find vehicle info for vin ${vin}`);
    }

    return info;
  }

  async vehicleList(): Promise<VehicleSummary[]> {
    await this.logIn({userId: this.userId, password: this.password});

    const res = await this.axios.get('https://owners.kia.com/apps/services/owners/get/vehiclelist', {
      headers: {
        cookie: this.cookies?.join('; '),
      },
    });

    this.log.debug('vehicleList', res.data);

    return res.data.payload.vehicleSummary;
  }

  async waitForTransaction(vin: string, xid: string): Promise<boolean> {
    return backOff(
      async () => {
        this.log.debug('waitForTransaction', xid);
        return this.getTransactionStatus(vin, xid);
      },
      {
        numOfAttempts: 8,
        startingDelay: 1000 * 5, // 10 seconds
        timeMultiple: 0.8, // Reduce the time between requests, we should be getting closer to a result.
      },
    );
  }

  private logIn = async ({userId, password}: LogInRequest) => {
    // If we last logged in less than 5 minutes ago for the same vin, don't log in again
    if (this.lastLogin && this.lastLogin?.getTime() > Date.now() - (1000 * 60 * 10)) {
      this.log.debug('logIn', 'cache hit');
      return;
    }

    // We only want one login request out at a time.
    await singleflight.Do('login', async () => {
      const req = {userId, password, userType: '0', action: 'authenticateUser'};
      const res = await axios.post(
        'https://owners.kia.com/apps/services/owners/apiGateway',
        JSON.stringify(req),
        {
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.7',
            'authority': 'owners.kia.com',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.cookies = res.headers['set-cookie'];

      const data = res.data as LogInResponse;

      this.log.debug('logIn', res.data);

      // For each vehicle, map the vin to the vehicle key
      data.payload.vehicleSummary.forEach((summary) => {
        this.vehicleKeys.set(summary.vin, summary.vehicleKey);
      });

      this.lastLogin = new Date();
    });
  };
}

