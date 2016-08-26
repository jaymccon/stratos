(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.ServiceInstanceAccess
   * @memberof cloud-foundry.model
   * @name ServiceInstanceAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.serviceInstanceAccess',
      ServiceInstanceAccessFactory(modelManager));
  }

  /**
   * @name ServiceInstanceAccessFactory
   * @description Function to get a ServiceInstanceAccess class
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @returns {ServiceInstanceAccess}
   * @constructor
   */
  function ServiceInstanceAccessFactory(modelManager) {
    /**
     * @name ServiceInstanceAccess
     * @description Constructor for ServiceInstanceAccess
     * @param {Principal} principal Principal instance
     * @param {Array} flags feature flags
     * @constructor
     */
    function ServiceInstanceAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(ServiceInstanceAccess.prototype, {
      /**
       * @name create
       * @description A User is can create a service if:
       * 1. User is an admin
       * 2. Is a space developer and the feature flag is enabled
       * @param {Object} space Domain space
       * @returns {boolean}
       */
      create: function (space) {

        // If user is developer in space the service instances will
        // belong to and the service_instance_creation flag is set
        // Admin
        if (this.baseAccess.create(space)) {
          return true;
        }

        return this.principal.hasAccessTo('service_instance_creation') &&
          this._doesContainGuid(this.principal.userSummary.spaces.all, space.metadata.guid);
      },

      /**
       * @name update
       * @description User can update a service instance if:
       * 1. User is an admin
       * 2. or a space developer
       * @param {Object} space - space detail
       * @returns {boolean}
       */
      update: function (space) {
        // Admin
        if (this.baseAccess.create(space)) {
          return true;
        }

        return this._doesContainGuid(this.principal.userSummary.spaces.all, space.metadata.guid);
      },

      /**
       * @name delete
       * @description User can delete a service instance if:
       * 1. They are an admin
       * 2. or they are a space developer
       * @param {Object} space - spacedetail
       * @returns {boolean}
       */
      delete: function (space) {
        // Admin
        if (this.baseAccess.delete(space)) {
          return true;
        }

        return this._doesContainGuid(this.principal.userSummary.spaces.all, space.metadata.guid);

      },

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `managed_service_instance` permission
       * @param {String} resource - string representing the resource
       * @returns {boolean}
       */
      canHandle: function (resource) {
        return resource === 'managed_service_instance';
      }
    });

    return ServiceInstanceAccess;
  }

})();
