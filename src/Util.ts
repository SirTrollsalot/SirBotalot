import * as AsciiTable from "ascii-table";

export type CommandOptions = {
    name: string,
    text?: string
};

export type HelpOptions = {
    title?: string,
    commands: [CommandOptions]
};

export function generateHelpText(options: HelpOptions): string {
    let table = new AsciiTable(options.title).setHeading("Command", "Description").removeBorder();
    options.commands.forEach(cmd => table.addRow(cmd.name, cmd.text));
    return table.toString();
}