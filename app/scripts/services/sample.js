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
                        {name: '勤務計画', sortable: false, drawTask: false, color: '#E0FFFF', tasks: [
                          {
                            id: '50',
                            name: '',
                            color: '#B0B0B0',
                            from: new Date(2016, 11, 15, 9, 0, 0),
                            to: new Date(2016, 11, 15, 19, 0, 0),
                            movable: false
                          }
                        ]},
                        {name: '就業実績', sortable: false, drawTask: false, color: '#E0FFFF', tasks: [
                          {
                            id: '51',
                            name: '',
                            color: '#6495ED',
                            from: new Date(2016, 11, 15, 8, 0, 0),
                            to: new Date(2016, 11, 15, 20, 30, 0),
                            movable: false
                          }
                        ]},
                        {name: '', id: '0', workmin: 150, drawTask: false, color: '#E0FFFF', tasks: []},
                        {name: '製造所', id: '1', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '荷卸し', id: '10', parent: '1', workmin: 60, tasks: [
                          {
                              id: '100',
                              name: '荷卸し',
                              color: '#9FC5F8',
                              from: new Date(2016, 11, 15, 8, 0, 0),
                              to: new Date(2016, 11, 15, 9, 0, 0),
                              workmin: 60,
                              movable: false
                          }
                        ]},
                        {name: '入荷検品', id: '11', parent: '1', workmin: 90, tasks: [
                          {
                              id: '101',
                              name: '入荷検品',
                              color: '#F1C232',
                              from: new Date(2016, 11, 15, 9, 0, 0),
                              to: new Date(2016, 11, 15, 10, 30, 0),
                          }
                        ]},
                        {name: '荷役（入荷）', id: '12', parent: '1', tasks: []},
                        {name: '出荷検品', id: '13', parent: '1', tasks: []},
                        {name: '荷役（出荷）', id: '14', parent: '1', tasks: []},
                        {name: '本倉庫', id: '2', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '梱', id: '21', parent: '2', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '入荷', id: '211', parent: '21', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '１Ｆ', id: '2111', parent: '211', tasks: []},
                        {name: '２Ｆ', id: '2112', parent: '211', tasks: []},
                        {name: '３Ｆ', id: '2113', parent: '211', tasks: []},
                        {name: '４Ｆ', id: '2114', parent: '211', tasks: []},
                        {name: '出荷', id: '212', parent: '21', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '１Ｆ', id: '2121', parent: '212', tasks: []},
                        {name: '２Ｆ', id: '2122', parent: '212', tasks: []},
                        {name: '３Ｆ', id: '2123', parent: '212', tasks: []},
                        {name: '４Ｆ', id: '2124', parent: '212', tasks: []},

                        {name: '検品・荷造り・積込', id: '213', parent: '21', tasks: []},
                        {name: '外部倉庫', id: '214', parent: '21', tasks: []},

                        {name: 'バラ', id: '22', parent: '2', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '商品', id: '221', parent: '22', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: 'カート（積送）', id: '2211', parent: '221', tasks: []},
                        {name: 'カート（広域）', id: '2212', parent: '221', tasks: []},
                        {name: 'カート（コスミリオン）', id: '2213', parent: '221', tasks: []},
                        {name: '梱包/積付/他', id: '2214', parent: '221', tasks: []},
                        {name: '欠山', id: '2215', parent: '221', tasks: []},
                        {name: '欠山（コスミリオン）', id: '2216', parent: '221', tasks: []},

                        {name: '販促', id: '222', parent: '22', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '販促バラ（積送）', id: '2221', parent: '222', tasks: []},
                        {name: '販促バラ（経費）', id: '2222', parent: '222', tasks: []},
                        {name: '販促バラ（広域）', id: '2223', parent: '222', tasks: []},
                        {name: '積付/他', id: '2224', parent: '222', tasks: []},

                        {name: '輸出業務', id: '23', parent: '2', tasks: []},

                        {name: '他', id: '24', parent: '2', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: 'セット加工', id: '241', parent: '24', tasks: []},
                        {name: '棚卸し', id: '242', parent: '24', tasks: []},
                        {name: '３Ｓ', id: '243', parent: '24', tasks: []},
                        {name: '事務', id: '244', parent: '24', tasks: []},
                        {name: 'その他', id: '245', parent: '24', tasks: []},
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
