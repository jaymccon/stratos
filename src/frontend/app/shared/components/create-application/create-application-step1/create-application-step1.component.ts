import { AfterContentInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { map, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { ISpace } from '../../../../core/cf-api.types';
import { PermissionStrings } from '../../../../core/current-user-permissions.config';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { SetCFDetails } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';
import {
  getSpacesFromOrgWithRole,
} from '../../../../store/selectors/current-user-roles-permissions-selectors/role.selectors';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';

@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit, OnDestroy {

  @Input('isMarketplaceMode')
  isMarketplaceMode: boolean;
  constructor(
    private store: Store<AppState>,
    public cfOrgSpaceService: CfOrgSpaceDataService
  ) { }

  public spaces$: Observable<ISpace[]>;
  public hasSpaces$: Observable<boolean>;
  public hasOrgs$: Observable<boolean>;

  @ViewChild('cfForm')
  cfForm: NgForm;

  @Input('isRedeploy') isRedeploy = false;

  valid = false;
  private validSub: Subscription;

  @Input('stepperText')
  stepperText = 'Select a Cloud Foundry instance, organization and space for the app.';

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return observableOf({ success: true });
  }

  ngOnInit() {
    this.spaces$ = this.getSpacesFromPermissions();
    this.hasOrgs$ = this.cfOrgSpaceService.org.list$.pipe(
      map(o => o && o.length > 0)
    );
    this.hasSpaces$ = this.spaces$.pipe(
      map(spaces => !!spaces.length)
    );
    if (this.isRedeploy) {
      this.stepperText = 'Review the Cloud Foundry instance, organization and space for the app.';
    }

    if (this.isMarketplaceMode) {
      this.stepperText = 'Select an organization and space for the service instance.';
    }
  }

  ngAfterContentInit() {
    this.validSub = this.cfForm.statusChanges.pipe(
      startWith(this.cfForm.valid || this.isRedeploy),
      map(() => this.cfForm.valid || this.isRedeploy),
      tap((valid) => setTimeout(() => this.valid = valid))
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.validSub.unsubscribe();
  }

  private getSpacesFromPermissions() {
    return this.cfOrgSpaceService.org.select.pipe(
      withLatestFrom(this.cfOrgSpaceService.cf.select),
      switchMap(([orgGuid, endpointGuid]) => {
        return this.store.select(getSpacesFromOrgWithRole(endpointGuid, orgGuid, PermissionStrings.SPACE_DEVELOPER));
      }),
      switchMap((spacesOrAll => {
        if (spacesOrAll === 'all') {
          return this.cfOrgSpaceService.space.list$;
        }
        const spaceIds = spacesOrAll as string[];
        return this.cfOrgSpaceService.space.list$.pipe(
          map(spaces => {
            const filteredSpaces = spaces.filter(space => spaceIds.find(spaceGuid => spaceGuid === space.guid));
            return filteredSpaces;
          })
        );
      }))
    );
  }
}
