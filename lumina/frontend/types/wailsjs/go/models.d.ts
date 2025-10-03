export declare namespace domain {
    class Node {
        name: string;
        type: string;
        children: Node[];
        static createFrom(source?: any): Node;
        constructor(source?: any);
        convertValues(a: any, classs: any, asMap?: boolean): any;
    }
}
