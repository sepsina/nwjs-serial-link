import { ApplicationConfig } from '@angular/core';
import { SerialService } from './serial.service';
import { EventsService } from './events.service';
import { UtilsService } from './utils.service';
import { GlobalsService } from './globals.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
    providers: [
        SerialService,
        EventsService,
        UtilsService,
        GlobalsService,
        provideAnimationsAsync()
    ]
};
