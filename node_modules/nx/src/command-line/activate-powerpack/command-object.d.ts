import { CommandModule } from 'yargs';
export interface ActivatePowerpackOptions {
    license: string;
    verbose: boolean;
}
export declare const yargsActivatePowerpackCommand: CommandModule<{}, ActivatePowerpackOptions>;
