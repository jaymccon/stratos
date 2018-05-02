import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { combineLatest, filter, first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import {
  CfRolesService,
  CfUserRolesSelected,
  UserRoleLabels,
} from '../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import {
  ManageUsersSetOrgRole,
  ManageUsersSetSpaceRole,
  selectManageUsersPicked,
} from '../../../store/actions/users.actions';
import { AppState } from '../../../store/app-state';
import { CfUser, IUserPermissionInOrg } from '../../../store/types/user.types';
import { OrgUserRoleNames } from '../../../features/cloud-foundry/cf.helpers';



@Component({
  selector: 'app-cf-role-checkbox',
  templateUrl: './cf-role-checkbox.component.html',
  styleUrls: ['./cf-role-checkbox.component.scss'],
  // providers: [
  //   getActiveRouteCfOrgSpaceProvider,
  // ]
})
export class CfRoleCheckboxComponent implements OnInit, OnDestroy {


  @Input() spaceGuid: string;
  @Input() role: string;
  @Output() changed = new BehaviorSubject(false);
  // @Output() update: () => void;

  checked: Boolean = false;
  tooltip = '';
  sub: Subscription;
  // users: CfUser[];
  isOrgRole = false;
  disabled = false;
  orgGuid: string;

  private static hasExistingRole(role: string, roles: CfUserRolesSelected, userGuid: string, orgGuid: string, spaceGuid: string): boolean {
    if (roles && roles[userGuid] && roles[userGuid][orgGuid]) {
      return !!this.hasRole(role, roles[userGuid][orgGuid], spaceGuid);
    }
    return false;
  }

  private static hasRole(role: string, orgRoles: IUserPermissionInOrg, spaceGuid: string): Boolean {
    if (!orgRoles) {
      return undefined;
    }
    if (spaceGuid) {
      const spaceRoles = orgRoles.spaces[spaceGuid];
      return spaceRoles ? spaceRoles.permissions[role] : undefined;
    } else {
      return orgRoles.permissions[role];
    }
  }

  private static getCheckedState(
    role: string,
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string,
    spaceGuid?: string): {
      checked: Boolean;
      tooltip: string;
    } {
    let tooltip = '';
    // Has the user set any state for this role?
    let checked = CfRoleCheckboxComponent.hasRole(role, newRoles, spaceGuid);
    // No? Has the user got a existing/previous state for this role?
    if (checked === undefined) { //
      // Do all or some have the role?
      if (users.length === 1) {
        const userGuid = users[0].guid;
        checked = CfRoleCheckboxComponent.hasExistingRole(role, existingRoles, userGuid, orgGuid, spaceGuid);
      } else {
        let oneWithout = false;
        tooltip = '';
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          if (CfRoleCheckboxComponent.hasExistingRole(role, existingRoles, user.guid, orgGuid, spaceGuid)) {
            tooltip += `${user.username}, `;
          } else {
            oneWithout = true;
          }
        }

        // Does any one of these users have this role?
        if (tooltip.length) {
          // Do all users have the role, or has one not got the role
          if (!oneWithout) {
            // All have role
            checked = true;
            // All have this state, no need to show the list of users
            tooltip = '';
          } else {
            // At least one does not have role, tertiary state
            checked = null;
            tooltip = tooltip.substring(0, tooltip.length - 2);
          }
        } else {
          // No user has the role
          checked = false;
        }
      }
    }
    return { checked, tooltip };
  }

  private static isDisabled(
    isOrgRole: boolean,
    role: string,
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string): boolean {
    // Determine if the checkbox is disabled (is this the org user checkbox and are other org roles true (true || null))
    if (isOrgRole && role === 'user') {
      return CfRoleCheckboxComponent.getCheckedState(OrgUserRoleNames.MANAGER, users, existingRoles, newRoles, orgGuid).checked !== false ||
        CfRoleCheckboxComponent.getCheckedState(OrgUserRoleNames.BILLING_MANAGERS, users, existingRoles, newRoles, orgGuid).checked !== false ||
        CfRoleCheckboxComponent.getCheckedState(OrgUserRoleNames.AUDITOR, users, existingRoles, newRoles, orgGuid).checked !== false;
    }
    return false;
  }


  constructor(private cfRolesService: CfRolesService, private store: Store<AppState>) { }

  ngOnInit() {
    this.isOrgRole = !this.spaceGuid;
    const users$ = this.store.select(selectManageUsersPicked);
    this.sub = this.cfRolesService.existingRoles$.pipe(
      combineLatest(this.cfRolesService.newRoles$, users$),
      filter(([existingRoles, newRoles, users]) => !!users.length && !!newRoles.orgGuid)
    ).subscribe(([existingRoles, newRoles, users]) => {
      this.orgGuid = newRoles.orgGuid;
      const { checked, tooltip } = CfRoleCheckboxComponent.getCheckedState(
        this.role, users, existingRoles, newRoles, this.orgGuid, this.spaceGuid);
      this.checked = checked;
      this.tooltip = tooltip;
      this.disabled = CfRoleCheckboxComponent.isDisabled(this.isOrgRole, this.role, users, existingRoles, newRoles, this.orgGuid);
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  public getLabel(): string {
    return this.spaceGuid ? '' : UserRoleLabels.org[this.role];
  }

  public roleUpdated(checked: boolean) {
    this.checked = checked;
    this.cfRolesService.newRoles$.pipe(
      first()
    ).subscribe(newRoles => {
      if (!checked) {
        this.tooltip = '';
      }
      if (this.isOrgRole) {
        this.store.dispatch(new ManageUsersSetOrgRole(this.orgGuid, this.role, checked));
        // if (checked && this.role !== 'user' && !newRoles.permissions.user) {
        //   this.store.dispatch(new ManageUsersSetOrgRole(this.orgGuid, 'user', true));
        // }
      } else {
        this.store.dispatch(new ManageUsersSetSpaceRole(this.orgGuid, this.spaceGuid, this.role, checked));
      }
      this.safeChanged(checked);
    });
  }

  private safeChanged(checked) {
    if (this.changed) {
      // this.changed.next(checked);
    }
  }

}