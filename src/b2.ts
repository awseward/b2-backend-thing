import axios from "axios";
import { handleAxiosError } from "./util";

const { get, post } = axios;

export interface AppCred {
  keyId: string;
  key: string;
};

export interface UrlParts {
  apiUrl: string; // returned by b2_authorize_account
  versionNumber: number;
  apiName: string;
}

export interface B2AccountAuthorization {
  allowed: { bucketId: string };
  apiUrl: string;
  authorizationToken: string;
};

export interface B2GetUploadUrlResponse {
  authorizationToken: string,
  bucketId: string,
  uploadUrl: string
}

const authorizeAccount = (
  { keyId, key }: AppCred,
  url : string = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account'
) =>
  get<B2AccountAuthorization>(
    url,
    {
      auth: {
        username: keyId,
        password: key
      }
    }
  ).catch(handleAxiosError).then(res => res.data);

const mkUrl = ({ apiUrl, versionNumber, apiName }: UrlParts) =>
  `${apiUrl}/b2api/v${versionNumber}/${apiName}`;

const getUploadUrl = (
  urlParts: Pick<UrlParts, 'apiUrl'|'versionNumber'>,
  authToken: string,
  bucketId: string
) =>
  post<B2GetUploadUrlResponse>(
    mkUrl({ ...urlParts, apiName: 'b2_get_upload_url' }),
    { bucketId },
    { headers: { 'Authorization': authToken }, }
  ).catch(handleAxiosError).then(res => res.data);

export default {
  authorizeAccount,
  getUploadUrl,
  mkUrl,
};