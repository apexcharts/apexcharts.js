import { VERSION } from "./version";
import { paginate } from "./paginate";
import { iterator } from "./iterator";
import { composePaginateRest } from "./compose-paginate";
import {
  isPaginatingEndpoint,
  paginatingEndpoints
} from "./paginating-endpoints";
function paginateRest(octokit) {
  return {
    paginate: Object.assign(paginate.bind(null, octokit), {
      iterator: iterator.bind(null, octokit)
    })
  };
}
paginateRest.VERSION = VERSION;
export {
  composePaginateRest,
  isPaginatingEndpoint,
  paginateRest,
  paginatingEndpoints
};
