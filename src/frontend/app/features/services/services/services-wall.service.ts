import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';

import { IService, IServiceBroker, IServicePlanVisibility } from '../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetServiceBrokers } from '../../../store/actions/service-broker.actions';
import { GetServicePlanVisibilities } from '../../../store/actions/service-plan-visibility.actions';
import { GetAllServices } from '../../../store/actions/service.actions';
import { AppState } from '../../../store/app-state';
import {
  entityFactory,
  serviceBrokerSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceSchemaKey,
} from '../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../store/types/api.types';

@Injectable()
export class ServicesWallService {
  services$: Observable<APIResource<IService>[]>;

  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.services$ = this.initServicesObservable();

  }

  initServicesObservable = () => {
    const paginationKey = createEntityRelationPaginationKey(serviceSchemaKey, 'all');
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: new GetAllServices(paginationKey),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(serviceSchemaKey)
        )
      },
      true
    ).entities$;
  }

  getServicesInCf = (cfGuid: string) => this.services$.pipe(
    filter(p => !!p && p.length > 0),
    map(services => services.filter(s => s.entity.cfGuid === cfGuid))
  )

}
