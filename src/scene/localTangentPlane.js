import * as vec3 from './glMatrix/vec3';

export function LocalTangentPlane() {
    this.init = function (longitude, latitude, altitude)
    {
        longitude = longitude * Math.PI / 180;
        latitude = latitude * Math.PI / 180;

        this.longitudeOrig = longitude;
        this.latitudeOrig = latitude;

        this.eSquare = 0.081819191 * 0.081819191;
        this.earthSemiMajor = 6378137.0;
        this.earthSemiMinor = 6356752.3142;

        this.eccentricityMajor = (this.earthSemiMajor * this.earthSemiMajor - this.earthSemiMinor * this.earthSemiMinor) / (this.earthSemiMajor * this.earthSemiMajor);
        this.eccentricityMinor = (this.earthSemiMajor * this.earthSemiMajor - this.earthSemiMinor * this.earthSemiMinor) / (this.earthSemiMinor * this.earthSemiMinor);

        this.ltpOrig = this.LLAToECEF(longitude, latitude, altitude);
        let ltpOrigTop = this.LLAToECEF(longitude, latitude, altitude + 1000);

        this.normalUp = vec3.create();
        vec3.subtract(this.normalUp, ltpOrigTop, this.ltpOrig);
        vec3.normalize(this.normalUp, this.normalUp);

        this.normalEast = vec3.create();
        vec3.cross(this.normalEast, [0, 0, 1], this.normalUp);
        vec3.normalize(this.normalEast, this.normalEast);

        this.normalNorth = vec3.create();
        vec3.cross(this.normalNorth, this.normalUp, this.normalEast);
        vec3.normalize(this.normalNorth, this.normalNorth);

        this.altitudeOrig = altitude;
    }

    this.LTP2LLA = function (east, north, height) {
        let localEast = vec3.create();
        vec3.scale(localEast, this.normalEast, east);

        let localNorth = vec3.create();
        vec3.scale(localNorth, this.normalNorth, north);

        let localHeight = vec3.create();
        vec3.scale(localHeight, this.normalUp, height);

        vec3.add(localEast, this.ltpOrig, localEast);
        vec3.add(localEast, localNorth, localEast);
        vec3.add(localEast, localHeight, localEast);

        localEast = this.ECEFToLLA(localEast[0], localEast[1], localEast[2]);

        localEast[0] *= 180 / Math.PI;
        localEast[1] *= 180 / Math.PI;

        let accuracy = 100000000;
        localEast[0] = Math.floor(localEast[0] * accuracy) / accuracy;
        localEast[1] = Math.floor(localEast[1] * accuracy) / accuracy;

        let dmsLongitude = this.RadianToDMS(localEast[0], false);
        let dmsLatitude = this.RadianToDMS(localEast[1], true);
        return [localEast[0], localEast[1], this.altitudeOrig + height, dmsLongitude, dmsLatitude];
    }

    this.RadianToDegree = function (radian) {
        let degree = radian * 180 / Math.PI;

        let accuracy = 100000000;
        degree = Math.floor(degree * accuracy) / accuracy;
        return degree;
    }

    this.RadianToDMS = function(radian, isLatitude) {
        let degree = 0;
        let minute = 0;
        let second = 0;

        let radina = Math.abs(radian);
    
        degree = Math.floor(radina);
    
        second = (radina - degree) * 3600;
    
        minute = Math.floor(second / 60);
    
        second = Math.floor((second - (minute * 60)) * 100) / 100;

        // if (radian < 0)
        // {
        //     if (isLatitude)
        //     {
        //         return degree + '°' + minute + '′' + second + '"' + ' S';
        //     }
        //     else
        //     {
        //         return degree + '°' + minute + '′' + second + '"' + ' W';
        //     }
        // }
        // else
        // {
        //     if (isLatitude) {
        //         return degree + '°' + minute + '′' + second + '"' + ' N';
        //     }
        //     else {
        //         return degree + '°' + minute + '′' + second + '"' + ' E';
        //     }
        // }
    }

    this.LLAToECEF = function(longitude, latitude, height)
    {
        let n = this.earthSemiMajor / Math.sqrt(1 - this.eSquare * Math.sin(latitude) * Math.sin(latitude));
        let x = (n + height) * Math.cos(latitude) * Math.cos(longitude);
        let y = (n + height) * Math.cos(latitude) * Math.sin(longitude);
        let z = (height + (1 - this.eSquare) * n) * Math.sin(latitude);

        return [x, y, z];
    }

    this.ECEFToLLA = function (x, y, z)
    {
        let longitude = Math.atan2(y, x);

        let p = Math.sqrt(x * x + y * y);
        let theta = Math.atan2(z * this.earthSemiMajor, p * this.earthSemiMinor);

        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        let latitude = Math.atan2(z + this.eccentricityMinor * this.earthSemiMinor * sinTheta * sinTheta * sinTheta,
                         p - this.eccentricityMajor * this.earthSemiMajor * cosTheta * cosTheta * cosTheta);

        let d = Math.sin(latitude);

        let altitude = p / Math.cos(latitude) - this.earthSemiMajor / Math.sqrt(1 - this.eccentricityMajor * d * d);

        return [longitude, latitude, altitude];
    }


}