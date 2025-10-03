import { ProjectTreeLister } from '../domain/project_tree_lister';
import { Node } from '../domain/node';
export declare class WailsProjectTreeLister implements ProjectTreeLister {
    getCurrentProjectTree(): Promise<Node>;
}
