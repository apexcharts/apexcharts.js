import { TouchedProjectLocator } from '../../../../project-graph/affected/affected-project-graph-models';
import { WholeFileChange } from '../../../../project-graph/file-utils';
import { JsonChange } from '../../../../utils/json-diff';
export declare const getTouchedProjectsFromLockFile: TouchedProjectLocator<WholeFileChange | JsonChange>;
