import inquirer from "inquirer";
/**
 * Prompt for confirmation
 */
export declare function promptConfirmation(message: string): Promise<boolean>;
type PromptSelectOneOptions = Partial<{
    choices: inquirer.ListChoiceOptions[];
} & Pick<inquirer.Question, "filter" | "validate">>;
/**
 * Prompt for selection
 */
export declare function promptSelectOne(message: string, { choices, filter, validate }?: PromptSelectOneOptions): Promise<string>;
/**
 * Prompt for input
 */
export declare function promptTextInput(message: string, { filter, validate }?: Pick<inquirer.Question, "filter" | "validate">): Promise<string>;
export {};
