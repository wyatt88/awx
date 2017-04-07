/*************************************************
 * Copyright (c) 2015 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

import host from './hosts/main';
import inventoryAdd from './add/main';
import inventoryEdit from './edit/main';
import inventoryList from './list/main';
import { templateUrl } from '../shared/template-url/template-url.factory';
import { N_ } from '../i18n';
import InventoryList from './inventory.list';
import InventoryForm from './inventory.form';
export default
angular.module('inventory', [
        host.name,
        inventoryAdd.name,
        inventoryEdit.name,
        inventoryList.name
    ])
    .factory('InventoryForm', InventoryForm)
    .factory('InventoryList', InventoryList)
    .config(['$stateProvider', '$stateExtenderProvider', 'stateDefinitionsProvider',
        function($stateProvider, $stateExtenderProvider, stateDefinitionsProvider) {
            // When stateDefinition.lazyLoad() resolves, states matching name.** or /url** will be de-registered and replaced with resolved states
            // This means inventoryManage states will not be registered correctly on page refresh, unless they're registered at the same time as the inventories state tree
            let stateDefinitions = stateDefinitionsProvider.$get(),
            stateExtender = $stateExtenderProvider.$get();

                function foobar() {

                    let smartInventoryAdd = {
                        name: 'hosts.addSmartInventory',
                        url: '/smartinventory',
                        form: 'SmartInventoryForm',
                        ncyBreadcrumb: {
                            label: "CREATE SMART INVENTORY"
                        },
                        views: {
                            'form@hosts': {
                                templateProvider: function(SmartInventoryForm, GenerateForm) {
                                    return GenerateForm.buildHTML(SmartInventoryForm, {
                                        mode: 'add',
                                        related: false
                                    });
                                },
                                controller: 'SmartInventoryAddController'
                            }
                        }
                    };

                    let hosts = stateDefinitions.generateTree({
                        parent: 'hosts', // top-most node in the generated tree (will replace this state definition)
                        modes: ['add', 'edit'],
                        list: 'HostsList',
                        form: 'HostsForm',
                        controllers: {
                            list: 'HostListController',
                            add: 'HostAddController',
                            edit: 'HostEditController'
                        },
                        urls: {
                            list: '/hosts'
                        },
                        resolve: {
                            edit: {
                                host: ['Rest', '$stateParams', 'GetBasePath',
                                    function(Rest, $stateParams, GetBasePath) {
                                        let path = GetBasePath('hosts') + $stateParams.host_id;
                                        Rest.setUrl(path);
                                        return Rest.get();
                                    }
                                ]
                            }
                        },
                        ncyBreadcrumb: {
                            label: N_('HOSTS')
                        },
                        views: {
                            '@': {
                                templateUrl: templateUrl('inventories/inventories')
                            },
                            'list@hosts': {
                                templateProvider: function(HostsList, generateList) {
                                    let html = generateList.build({
                                        list: HostsList,
                                        mode: 'edit'
                                    });
                                    return html;
                                },
                                controller: 'HostListController'
                            }
                        }
                    });

                    return Promise.all([
                        hosts
                    ]).then((generated) => {
                        return {
                            states: _.reduce(generated, (result, definition) => {
                                return result.concat(definition.states);
                            }, [
                                stateExtender.buildDefinition(smartInventoryAdd)
                            ])
                        };
                    });

                }

                $stateProvider.state({
                    name: 'inventories',
                    url: '/inventories',
                    lazyLoad: () => stateDefinitions.generateTree({
                        parent: 'inventories', // top-most node in the generated tree (will replace this state definition)
                        modes: ['add', 'edit'],
                        list: 'InventoryList',
                        form: 'InventoryForm',
                        controllers: {
                            list: 'InventoryListController',
                            add: 'InventoryAddController',
                            edit: 'InventoryEditController'
                        },
                        urls: {
                            list: '/inventories'
                        },
                        ncyBreadcrumb: {
                            label: N_('INVENTORIES')
                        },
                        views: {
                            '@': {
                                templateUrl: templateUrl('inventories/inventories')
                            },
                            'list@inventories': {
                                templateProvider: function(InventoryList, generateList) {
                                    let html = generateList.build({
                                        list: InventoryList,
                                        mode: 'edit'
                                    });
                                    return html;
                                },
                                controller: 'InventoryListController'
                            }
                        }
                    })
                });

                $stateProvider.state({
                    name: 'hosts',
                    url: '/hosts',
                    lazyLoad: () => foobar()
                });
        }
    ]);
