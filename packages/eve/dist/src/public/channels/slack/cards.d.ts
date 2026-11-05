declare const _Actions: ActionsComponent;
interface ActionsComponent {
    (children: (ButtonElement | LinkButtonElement | SelectElement | RadioSelectElement)[]): ActionsElement;
}
interface ButtonElement {
    actionType?: "action" | "modal";
    callbackUrl?: string;
    disabled?: boolean;
    id: string;
    label: string;
    style?: ButtonStyle;
    tooltip?: string;
    type: "button";
    value?: string;
    visibleTo?: string[];
}
type ButtonStyle = "primary" | "danger" | "default";
interface LinkButtonElement {
    id?: string;
    label: string;
    style?: ButtonStyle;
    tooltip?: string;
    type: "link-button";
    url: string;
    visibleTo?: string[];
}
interface SelectElement {
    dispatchAction?: boolean;
    id: string;
    initialOption?: string;
    label: string;
    optional?: boolean;
    options: SelectOptionElement[];
    placeholder?: string;
    type: "select";
}
interface SelectOptionElement {
    description?: string;
    label: string;
    value: string;
}
interface RadioSelectElement {
    dispatchAction?: boolean;
    id: string;
    initialOption?: string;
    label: string;
    optional?: boolean;
    options: SelectOptionElement[];
    type: "radio_select";
}
interface ActionsElement {
    children: (ButtonElement | LinkButtonElement | SelectElement | RadioSelectElement)[];
    type: "actions";
}
type CardWidth = "default" | "full";
type TextStyle = "plain" | "bold" | "muted";
interface TableOptions {
    align?: TableAlignment[];
    caption?: string;
    gridLines?: boolean;
    gridStyle?: TableGridStyle;
    headers: string[];
    pageSize?: number;
    rows: string[][];
    verticalAlign?: TableVerticalAlignment;
    widths?: number[];
}
type TableAlignment = "left" | "center" | "right";
type TableGridStyle = "default" | "emphasis" | "accent" | "good" | "attention" | "warning";
type TableVerticalAlignment = "top" | "center" | "bottom";
type ChartDefinition = PieChartDefinition | SeriesChartDefinition;
interface PieChartDefinition {
    segments: ChartSegment[];
    type: "pie";
}
interface ChartSegment {
    label: string;
    value: number;
}
interface SeriesChartDefinition {
    categories: string[];
    series: ChartSeries[];
    type: "area" | "bar" | "line";
    xLabel?: string;
    yLabel?: string;
}
interface ChartSeries {
    data: ChartDataPoint[];
    name: string;
}
interface ChartDataPoint {
    label: string;
    value: number;
}
interface CardOptions {
    children?: CardChild[];
    imageUrl?: string;
    subtitle?: string;
    title?: string;
    width?: CardWidth;
}
type CardChild = TextElement | ImageElement | DividerElement | ActionsElement | SectionElement | FieldsElement | LinkElement | TableElement | ChartElement;
interface TextElement {
    content: string;
    style?: TextStyle;
    type: "text";
}
interface ImageElement {
    alt?: string;
    type: "image";
    url: string;
}
interface DividerElement {
    type: "divider";
}
interface SectionElement {
    children: CardChild[];
    type: "section";
}
interface FieldsElement {
    children: FieldElement[];
    type: "fields";
}
interface FieldElement {
    label: string;
    type: "field";
    value: string;
}
interface LinkElement {
    label: string;
    type: "link";
    url: string;
}
interface TableElement extends TableOptions {
    type: "table";
}
interface ChartElement {
    chart: ChartDefinition;
    title: string;
    type: "chart";
}
interface CardElement {
    children: CardChild[];
    imageUrl?: string;
    subtitle?: string;
    title?: string;
    type: "card";
    width?: CardWidth;
}
interface ButtonOptions {
    actionType?: "action" | "modal";
    callbackUrl?: string;
    disabled?: boolean;
    id: string;
    label: string;
    style?: ButtonStyle;
    tooltip?: string;
    value?: string;
    visibleTo?: string[];
}
interface LinkButtonOptions {
    id?: string;
    label: string;
    style?: ButtonStyle;
    tooltip?: string;
    url: string;
    visibleTo?: string[];
}
interface SelectOptions {
    dispatchAction?: boolean;
    id: string;
    initialOption?: string;
    label: string;
    optional?: boolean;
    options: SelectOptionElement[];
    placeholder?: string;
}
interface RadioSelectOptions {
    dispatchAction?: boolean;
    id: string;
    initialOption?: string;
    label: string;
    optional?: boolean;
    options: SelectOptionElement[];
}
declare function _Table(options: TableOptions): TableElement;
declare const _ButtonInternal: ButtonComponent;
interface ButtonComponent {
    (options: ButtonOptions): ButtonElement;
}
declare const _CardInternal: CardComponent;
interface CardComponent {
    (options?: CardOptions): CardElement;
}
declare const _CardLinkInternal: CardLinkComponent;
interface CardLinkComponent {
    (options: {
        url: string;
        label: string;
    }): LinkElement;
}
declare const _CardText: TextComponent;
interface TextComponent {
    (content: string, options?: {
        style?: TextStyle;
    }): TextElement;
}
declare const _DividerInternal: DividerComponent;
interface DividerComponent {
    (): DividerElement;
}
declare const _FieldInternal: FieldComponent;
interface FieldComponent {
    (options: {
        label: string;
        value: string;
    }): FieldElement;
}
declare const _FieldsInternal: FieldsComponent;
interface FieldsComponent {
    (children: FieldElement[]): FieldsElement;
}
declare const _ImageInternal: ImageComponent;
interface ImageComponent {
    (options: {
        url: string;
        alt?: string;
    }): ImageElement;
}
declare const _LinkButtonInternal: LinkButtonComponent;
interface LinkButtonComponent {
    (options: LinkButtonOptions): LinkButtonElement;
}
declare const _RadioSelectInternal: RadioSelectComponent;
interface RadioSelectComponent {
    (options: RadioSelectOptions): RadioSelectElement;
}
declare const _SectionInternal: SectionComponent;
interface SectionComponent {
    (children: CardChild[]): SectionElement;
}
declare const _SelectInternal: SelectComponent;
interface SelectComponent {
    (options: SelectOptions): SelectElement;
}
declare const _SelectOptionInternal: SelectOptionComponent;
interface SelectOptionComponent {
    (options: {
        label: string;
        value: string;
        description?: string;
    }): SelectOptionElement;
}
declare const _TableInternal: typeof _Table;
interface FileUpload {
    data: Buffer | Blob | ArrayBuffer;
    filename: string;
    mimeType?: string;
}
interface PostableCard {
    aiGenerated?: boolean;
    card: CardElement;
    fallbackText?: string;
    files?: FileUpload[];
}
export type { ActionsElement, ButtonElement, ButtonOptions, ButtonStyle, CardChild, CardElement, CardOptions, DividerElement, FieldElement, FieldsElement, FileUpload, ImageElement, LinkButtonElement, LinkButtonOptions, LinkElement, PostableCard, RadioSelectElement, RadioSelectOptions, SectionElement, SelectElement, SelectOptionElement, SelectOptions, TableAlignment, TableElement, TableOptions, TextElement, TextStyle, };
export declare const Actions: typeof _Actions;
export declare const Button: typeof _ButtonInternal;
export declare const Card: typeof _CardInternal;
export declare const CardLink: typeof _CardLinkInternal;
export declare const CardText: typeof _CardText;
export declare const Divider: typeof _DividerInternal;
export declare const Field: typeof _FieldInternal;
export declare const Fields: typeof _FieldsInternal;
export declare const Image: typeof _ImageInternal;
export declare const LinkButton: typeof _LinkButtonInternal;
export declare const RadioSelect: typeof _RadioSelectInternal;
export declare const Section: typeof _SectionInternal;
export declare const Select: typeof _SelectInternal;
export declare const SelectOption: typeof _SelectOptionInternal;
export declare const Table: typeof _TableInternal;
