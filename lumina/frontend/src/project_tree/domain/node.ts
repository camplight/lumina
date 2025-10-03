export interface Node {
  name: string;
  type: 'directory' | 'file';
  children: Node[];
}
