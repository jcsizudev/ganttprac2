'use strict';

/**
 * @ngdoc overview
 * @name P003PersonalWork
 * @description
 * # P003PersonalWork
 *
 * Main module of the application.
 */
angular.module('P003PersonalWork', [
    'gantt', // angular-gantt.
    'gantt.sortable',
    'gantt.movable',
    'gantt.drawtask',
    'gantt.tooltips',
    'gantt.bounds',
    'gantt.progress',
    'gantt.table',
    'gantt.tree',
    'gantt.groups',
    'gantt.dependencies',
    'gantt.overlap',
    'gantt.resizeSensor',
    'ngAnimate',
    'mgcrea.ngStrap',
    'ui.select'
]).config(['$compileProvider', 'uiSelectConfig', function($compileProvider, uiSelectConfig) {
    $compileProvider.debugInfoEnabled(false); // Remove debug info (angularJS >= 1.3)
    //treeConfig.defaultCollapsed = true;
    uiSelectConfig.theme = 'bootstrap';
}]);
