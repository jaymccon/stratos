import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import { endpointStoreNames, EndpointModel } from './endpoint.types';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import {
  AppEnvVarSchema,
  AppStatSchema,
  AppSummarySchema
} from './app-metadata.types';
import { SystemInfo } from './system.types';
import { IRoute, IFeatureFlag } from '../../core/cf-api.types';

export interface IRequestDataState extends IRequestTypeState {
  application: IRequestEntityTypeState<APIResource>;
  stack: IRequestEntityTypeState<APIResource>;
  space: IRequestEntityTypeState<APIResource>;
  organization: IRequestEntityTypeState<APIResource>;
  route: IRequestEntityTypeState<APIResource<IRoute>>;
  event: IRequestEntityTypeState<APIResource>;
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  githubBranches: IRequestEntityTypeState<APIResource>;
  githubCommits: IRequestEntityTypeState<APIResource>;
  domain: IRequestEntityTypeState<APIResource>;
  user: IRequestEntityTypeState<APIResource>;
  buildpack: IRequestEntityTypeState<APIResource>;
  featureFlag: IRequestEntityTypeState<IFeatureFlag>;
}

export interface IRequestState extends IRequestTypeState {
  application: IRequestEntityTypeState<RequestInfoState>;
  stack: IRequestEntityTypeState<RequestInfoState>;
  space: IRequestEntityTypeState<RequestInfoState>;
  organization: IRequestEntityTypeState<RequestInfoState>;
  route: IRequestEntityTypeState<RequestInfoState>;
  event: IRequestEntityTypeState<RequestInfoState>;
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  system: IRequestEntityTypeState<RequestInfoState>;
  githubBranches: IRequestEntityTypeState<RequestInfoState>;
  githubCommits: IRequestEntityTypeState<APIResource>;
  domain: IRequestEntityTypeState<RequestInfoState>;
  user: IRequestEntityTypeState<RequestInfoState>;
  buildpack: IRequestEntityTypeState<RequestInfoState>;
  featureFlag: IRequestEntityTypeState<IFeatureFlag>;
}

export const defaultCfEntitiesState = {
  application: {},
  stack: {},
  space: {},
  organization: {},
  route: {},
  event: {},
  endpoint: {},
  githubBranches: {},
  user: {},
  domain: {},
  buildpack: {},
  featureFlag: {},
  [AppEnvVarSchema.key]: {},
  [AppStatSchema.key]: {},
  [AppSummarySchema.key]: {}
};
