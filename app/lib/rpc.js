import { captureError } from '@lib/monitoring';

// Team / roster RPCs report failures either as a Postgres error or as
// { success: false, code, message }. This turns both into a thrown Error.
export function assertRpcOk(data, error) {
  if (error) {
    captureError(error, 'rpc'); // expected refusals are filtered out
    throw error;
  }
  if (data && data.success === false) {
    const err = new Error(data.message || 'Action failed');
    err.code = data.code;
    err.title = data.title;
    throw err;
  }
  return data;
}
