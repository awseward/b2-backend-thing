import axios from "axios";
import { handleAxiosError } from "./util";

const { post } = axios;

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

export const b2AuthorizeAccount = ({ keyId, key }: AppCred) =>
  axios.get<B2AccountAuthorization>(
    'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
    {
      auth: {
        username: keyId,
        password: key
      }
    }
  ).catch(handleAxiosError).then(res => res.data);

export const mkB2Url = ({ apiUrl, versionNumber, apiName }: UrlParts) =>
  `${apiUrl}/b2api/v${versionNumber}/${apiName}`;

export const b2GetUploadUrl = (
  urlParts: Pick<UrlParts, 'apiUrl'|'versionNumber'>,
  authToken: string,
  bucketId: string
) =>
  post<B2GetUploadUrlResponse>(
    mkB2Url({ ...urlParts, apiName: 'b2_get_upload_url' }),
    { bucketId },
    { headers: { 'Authorization': authToken }, }
  ).catch(handleAxiosError).then(res => res.data);
