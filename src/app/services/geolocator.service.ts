import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeolocatorService {
  private getIpAddressUrl = 'https://api.ipify.org/?format=json';
  private getGeolocationUrl = 'https://freeipapi.com/api/json/';

  constructor(private readonly http: HttpClient) { }

  public getIPAddress() {
    return this.http.get(this.getIpAddressUrl);
  }

  public getGeoLocation(ipAddress: string) {
    return this.http.get(`${this.getGeolocationUrl}${ipAddress}`);
  }
}
