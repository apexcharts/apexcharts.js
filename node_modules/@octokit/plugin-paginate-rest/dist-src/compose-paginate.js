import { paginate } from "./paginate";
import { iterator } from "./iterator";
const composePaginateRest = Object.assign(paginate, {
  iterator
});
export {
  composePaginateRest
};
