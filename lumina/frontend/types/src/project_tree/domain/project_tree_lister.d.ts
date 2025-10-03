import { Node } from './node';
export interface ProjectTreeLister {
    getCurrentProjectTree(): Promise<Node>;
}
export declare function getProjectTreeUseCase(lister: ProjectTreeLister): Promise<Node>;
