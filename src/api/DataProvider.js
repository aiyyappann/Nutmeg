import * as customerApi from './customers';
import * as activityApi from './activities';
import * as dealApi from './deals';
import * as interactionApi from './interactions';
import * as ticketApi from './supportTickets';
import * as segmentApi from './segments';
import * as statsApi from './stats';

export const DataProvider = {
  ...customerApi,
  ...activityApi,
  ...dealApi,
  ...interactionApi,
  ...ticketApi,
  ...segmentApi,
  ...statsApi,
};