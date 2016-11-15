'use strict';

/**
 * @ngdoc service
 * @name angularGanttDemoApp.Sample
 * @description
 * # Sample
 * Service in the angularGanttDemoApp.
 */
angular.module('angularGanttDemoApp')
    .service('Sample', function Sample() {
        return {
            getSampleData: function() {
                return [
                        // Order is optional. If not specified it will be assigned automatically
                        {name: '勤務計画', sortable: false, drawTask: false, color: '#A9E2F3', tasks: []},
                        {name: '就業実績', sortable: false, drawTask: false, color: '#A9E2F3', tasks: []},
                        {name: 'Status meetings', tasks: []},
                        {name: 'Kickoff', movable: {allowResizing: false}, tasks: []},
                        {name: 'Create concept', tasks: []},
                        {name: 'Finalize concept', tasks: []},
                        {name: 'Hosting'}
                    ];
            },
            getSampleTimespans: function() {
                return [
                        {
                            from: new Date(2016, 12, 15, 0, 0, 0),
                            to: new Date(2016, 12, 15, 8, 0, 0),
                            name: 'Timespan1'
                            //priority: undefined,
                            //classes: [],
                            //data: undefined
                        },
                        {
                            from: new Date(2016, 12, 16, 8, 0, 0),
                            to: new Date(2016, 12, 16, 13, 0, 0),
                            name: 'Timespan2'
                            //priority: undefined,
                            //classes: [],
                            //data: undefined
                        }
                    ];
            }
        };
    })
;
