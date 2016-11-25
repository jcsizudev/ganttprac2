'use strict';

/**
 * @ngdoc overview
 * @name angularGanttDemoApp
 * @description
 * # angularGanttDemoApp
 *
 * Main module of the application.
 */
angular.module('angularGanttDemoApp', [
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
    'mgcrea.ngStrap'
]).config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false); // Remove debug info (angularJS >= 1.3)
    //treeConfig.defaultCollapsed = true;
}]);

'use strict';

/**
 * @ngdoc function
 * @name angularGanttDemoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularGanttDemoApp
 */
angular.module('angularGanttDemoApp')
    .controller('MainCtrl', ['$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$popover', function($scope, $timeout, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment, $modal, $popover) {
        var objectModel;
        var dataToRemove;

        // Event handler
        var logScrollEvent = function(left, date, direction) {
            if (date !== undefined) {
                $log.info('[Event] api.on.scroll: ' + left + ', ' + (date === undefined ? 'undefined' : date.format()) + ', ' + direction);
            }
        };

        // Event handler
        var logDataEvent = function(eventName) {
            $log.info('[Event] ' + eventName);
            //console.log('logDataEvent');
            $timeout(function () {
              $scope.collapseAll();
              $scope.api.tree.expand('1');
              //$('.gantt-scrollable').scrollLeft(480);
              $('.gantt-table-content').attr('style', 'border-left: 2px solid #dddddd;');
              $('.gantt-row-label-header').attr('style', 'border-left: 2px solid #dddddd;');
              $('.gantt-tree-body').attr('style', 'border-left: 2px solid #dddddd;');
            }, 500);
        };

        // Event handler
        var logTaskEvent = function(eventName, task) {
            $log.info('[Event] ' + eventName + ': ' + task.model.name);
        };

        // Event handler
        var logRowEvent = function(eventName, row, e) {
            $log.info('[Event] ' + eventName + ': ' + row.model.name);
            console.log(e);
        };

        // Event handler
        var logTimespanEvent = function(eventName, timespan) {
            $log.info('[Event] ' + eventName + ': ' + timespan.model.name);
        };

        // Event handler
        var logLabelsEvent = function(eventName, width) {
            $log.info('[Event] ' + eventName + ': ' + width);
        };

        // Event handler
        var logColumnsGenerateEvent = function(columns, headers) {
            $log.info('[Event] ' + 'columns.on.generate' + ': ' + columns.length + ' column(s), ' + headers.length + ' header(s)');
        };

        // Event handler
        var logRowsFilterEvent = function(rows, filteredRows) {
            $log.info('[Event] rows.on.filter: ' + filteredRows.length + '/' + rows.length + ' rows displayed.');
        };

        // Event handler
        var logTasksFilterEvent = function(tasks, filteredTasks) {
            $log.info('[Event] tasks.on.filter: ' + filteredTasks.length + '/' + tasks.length + ' tasks displayed.');
        };

        // Event handler
        var logReadyEvent = function() {
            $log.info('[Event] core.on.ready');
        };

        // Event utility function
        var addEventName = function(eventName, func) {
            return function(data) {
                return func(eventName, data);
            };
        };

        /*
        $scope.onRegPopClickBack = function () {
          console.log('Reg-Back');
          console.log($(this));
        };

        $scope.onRegPopClickAdd = function () {
          console.log('Reg-Add');
          console.log($(this));
        };
        */

        $scope.popover = {
          fromDate: '1970-01-01T09:30:40.000Z',
          toDate: '1970-01-01T09:30:40.000Z',
          addFunc: function () {
            console.log('OK!');
          },
          create: function (element, row) {
            var pp = $popover(element, {
              animation: 'am-flip-x',
              autoClose: true,
              title: '作業時間登録',
              contentTemplate: 'template/P002_registration.html',
              trigger: 'manual',
              container: 'body',
              onShow: function () {
                console.log('PASS1');
                //$('#idTaskBtnBack').each().bind('click', function () {
                //  console.log('PASS2');
                //});
                $('#idTaskBtnBack').click(function (e) {
                  console.log('PASS2');
                });
                //$('#idTaskBtnAdd').click($scope.onRegPopClickBack);
              }
            });
            pp.show();
            //console.log(pp);
          }
        };

        // angular-gantt options
        $scope.options = {
            mode: 'custom',
            scale: 'hour',
            sortMode: undefined,
            sideMode: 'TreeTable',
            daily: false,
            maxHeight: false,
            width: false,
            zoom: 1,
            columns: ['model.name', 'workmin'],
            treeTableColumns: ['workmin'],
            columnsHeaders: {'model.name' : '作業項目', 'workmin': '分'},
            columnsClasses: {'model.name' : 'gantt-column-name', 'workmin': 'gantt-column-workmin'},
            columnsFormatters: {
                'workmin': function (value, column, row) {
                  return row.model.workmin !== undefined ? row.model.workmin : undefined;
                }
            },
            treeHeaderContent: '<i class="fa fa-align-justify"></i> {{getHeader()}}',
            columnsHeaderContents: {
                'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                'workmin': '<i class="fa fa-clock-o"></i> {{getHeader()}}'
            },
            autoExpand: 'none',
            taskOutOfRange: 'truncate',
            fromDate: moment(new Date(2016, 11, 15, 8, 0, 0)),
            toDate: moment(new Date(2016, 11, 16, 8, 0, 0)),
            rowContent: '<i class="fa fa-align-justify"></i> {{row.model.name}}',
            taskContent : '<i class="fa fa-tasks"></i> {{task.model.name}}',
            allowSideResizing: true,
            labelsEnabled: true,
            currentDate: 'none',
            currentDateValue: moment(new Date(2016, 11, 15, 11, 20, 0)),
            draw: true,
            readOnly: false,
            groupDisplayMode: 'none',//'group',
            filterTask: '',
            filterRow: '',
            columnMagnet: '15 minutes',
            dependencies: false,
            targetDataAddRowIndex: undefined,
            canDraw: function(event) {
                var isLeftMouseButton = event.button === 0 || event.button === 1;
                return $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
            },
            drawTaskFactory: function() {
                return {
                    id: utils.randomUuid(),  // Unique id of the task.
                    name: 'Drawn task', // Name shown on top of each task.
                    color: '#AA8833' // Color of the task in HEX format (Optional).
                };
            },
            api: function(api) {
                console.log('***API');
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

                api.core.on.ready($scope, function() {
                    console.log('***API_Ready');
                    // Log various events to console
                    api.scroll.on.scroll($scope, logScrollEvent);
                    api.core.on.ready($scope, logReadyEvent);

                    api.data.on.remove($scope, addEventName('data.on.remove', logDataEvent));
                    api.data.on.load($scope, addEventName('data.on.load', logDataEvent));
                    api.data.on.clear($scope, addEventName('data.on.clear', logDataEvent));
                    api.data.on.change($scope, addEventName('data.on.change', logDataEvent));

                    api.tasks.on.add($scope, addEventName('tasks.on.add', logTaskEvent));
                    api.tasks.on.change($scope, addEventName('tasks.on.change', logTaskEvent));
                    api.tasks.on.rowChange($scope, addEventName('tasks.on.rowChange', logTaskEvent));
                    api.tasks.on.remove($scope, addEventName('tasks.on.remove', logTaskEvent));

                    if (api.tasks.on.moveBegin) {
                        api.tasks.on.moveBegin($scope, addEventName('tasks.on.moveBegin', logTaskEvent));
                        //api.tasks.on.move($scope, addEventName('tasks.on.move', logTaskEvent));
                        api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', logTaskEvent));

                        api.tasks.on.resizeBegin($scope, addEventName('tasks.on.resizeBegin', logTaskEvent));
                        //api.tasks.on.resize($scope, addEventName('tasks.on.resize', logTaskEvent));
                        api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', logTaskEvent));
                    }

                    if (api.tasks.on.drawBegin) {
                        api.tasks.on.drawBegin($scope, addEventName('tasks.on.drawBegin', logTaskEvent));
                        //api.tasks.on.draw($scope, addEventName('tasks.on.draw', logTaskEvent));
                        api.tasks.on.drawEnd($scope, addEventName('tasks.on.drawEnd', logTaskEvent));
                    }

                    api.rows.on.add($scope, addEventName('rows.on.add', logRowEvent));
                    api.rows.on.change($scope, addEventName('rows.on.change', logRowEvent));
                    api.rows.on.move($scope, addEventName('rows.on.move', logRowEvent));
                    api.rows.on.remove($scope, addEventName('rows.on.remove', logRowEvent));

                    api.side.on.resizeBegin($scope, addEventName('labels.on.resizeBegin', logLabelsEvent));
                    //api.side.on.resize($scope, addEventName('labels.on.resize', logLabelsEvent));
                    api.side.on.resizeEnd($scope, addEventName('labels.on.resizeEnd', logLabelsEvent));

                    api.timespans.on.add($scope, addEventName('timespans.on.add', logTimespanEvent));
                    api.columns.on.generate($scope, logColumnsGenerateEvent);

                    api.rows.on.filter($scope, logRowsFilterEvent);
                    api.tasks.on.filter($scope, logTasksFilterEvent);

                    api.data.on.change($scope, function(newData) {
                        /*
                        if (dataToRemove === undefined) {
                            dataToRemove = [
                                {'id': newData[2].id}, // Remove Kickoff row
                                {
                                    'id': newData[0].id, 'tasks': [
                                    {'id': newData[0].tasks[0].id},
                                    {'id': newData[0].tasks[3].id}
                                ]
                                }, // Remove some Milestones
                                {
                                    'id': newData[7].id, 'tasks': [
                                    {'id': newData[7].tasks[0].id}
                                ]
                                } // Remove order basket from Sprint 2
                            ];
                        }
                        */
                        console.log(newData);
                    });

                    // When gantt is ready, load data.
                    // `data` attribute could have been used too.
                    $scope.load();

                    // Add some DOM events
                    api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                        if (directiveName === 'ganttTask') {
                            element.bind('click', function(event) {
                                event.stopPropagation();
                                logTaskEvent('task-click', directiveScope.task);
                            });
                            element.bind('mousedown touchstart', function(event) {
                                event.stopPropagation();
                                $scope.live.row = directiveScope.task.row.model;
                                if (directiveScope.task.originalModel !== undefined) {
                                    $scope.live.task = directiveScope.task.originalModel;
                                } else {
                                    $scope.live.task = directiveScope.task.model;
                                }
                                $scope.$digest();
                            });
                        } else if (directiveName === 'ganttRow') {
                            element.bind('click', function(event) {
                                event.stopPropagation();
                                logRowEvent('row-click', directiveScope.row, event);
                            });
                            element.bind('mousedown touchstart', function(event) {
                                event.stopPropagation();
                                $scope.live.row = directiveScope.row.model;
                                $scope.$digest();
                            });
                        } else if (directiveName === 'ganttRowLabel') {
                            if (directiveScope.row.model.id === '1') {
                              console.log('pass-製造所');
                              console.log(element);
                              //console.log(element.click);
                              console.log(jQuery._data($(element).get(0)));
                              if (jQuery._data($(element).get(0)).hasOwnProperty('events')) {
                                if (jQuery._data($(element).get(0)).events.hasOwnProperty('contextmenu')) {
                                  console.log(jQuery._data($(element).get(0)).events.click);
                                }
                              }
                              //var obj = jQuery._data($(element).get(0)).events;
                              //console.log(obj.hasOwnProperty('click'));
                              //console.log(jQuery._data($(element).get(0)).events.click);
                            }

                            // clickイベント
                            if (jQuery._data($(element).get(0)).hasOwnProperty('events')
                              && jQuery._data($(element).get(0)).events.hasOwnProperty('click')) {
                              // イベント設定済み
                            }
                            else {
                              element.bind('click', function() {
                                  logRowEvent('row-label-click', directiveScope.row, event);
                              });
                            }

                            /*
                            element.bind('contextmenu', function() {
                                rowContextMenuClick('row-label-context', directiveScope.row);
                                return false;
                            });
                            */
                            // contextmenuイベント
                            if (jQuery._data($(element).get(0)).hasOwnProperty('events')
                              && jQuery._data($(element).get(0)).events.hasOwnProperty('contextmenu')) {
                              // イベント設定済み
                            }
                            else {
                              if (element[0].nodeName === 'SPAN' && directiveScope.row && directiveScope.row.model) {
                                if (directiveScope.row.model.drawTask === false) {
                                  // タスク設定出来ない行
                                  element.bind('contextmenu', function() {
                                      return false;
                                  });
                                }
                                else {
                                  // ポップオーバー設定
                                  /*
                                  $popover(element, {
                                    animation: 'am-flip-x',
                                    autoClose: true,
                                    title: '作業時間登録',
                                    contentTemplate: 'template/P002_registration.html',
                                    trigger: 'manual',
                                    container: 'body',
                                    onShow: function () {
                                      console.log('PASS1');
                                      //$('#idTaskBtnBack').each().bind('click', function () {
                                      //  console.log('PASS2');
                                      //});
                                      $('#idTaskBtnBack').click(function (e) {
                                        console.log('PASS2');
                                      });
                                      //$('#idTaskBtnAdd').click($scope.onRegPopClickBack);
                                    }
                                  });
                                  */
                                  element.bind('contextmenu', function(e) {
                                      console.log($(e.currentTarget));
                                      $scope.popover.create($(e.currentTarget), directiveScope.row);
                                      return false;
                                  });
                                }
                              }
                            }

                            element.bind('mousedown touchstart', function() {
                                $scope.live.row = directiveScope.row.model;
                                $scope.$digest();
                            });
                        }
                    });

                    api.tasks.on.rowChange($scope, function(task) {
                        $scope.live.row = task.row.model;
                    });

                    objectModel = new ObjectModel(api);
                });
            }
        };

        $scope.headersFormats = {
          day: 'MM月DD日',
          hour: 'HH:mm'
        };

        $scope.handleTaskIconClick = function(taskModel) {
            alert('Icon from ' + taskModel.name + ' task has been clicked.');
        };

        $scope.handleRowIconClick = function(rowModel) {
            alert('Icon from ' + rowModel.name + ' row has been clicked.');
        };

        $scope.expandAll = function() {
            $scope.api.tree.expandAll();
        };

        $scope.collapseAll = function() {
            $scope.api.tree.collapseAll();
        };

        $scope.$watch('options.sideMode', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.api.side.setWidth(undefined);
                $timeout(function() {
                    $scope.api.columns.refresh();
                });
            }
        });

        $scope.canAutoWidth = function(scale) {
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
            return true;
        };

        $scope.getColumnWidth = function(widthEnabled, scale, zoom) {
            if (!widthEnabled && $scope.canAutoWidth(scale)) {
                return undefined;
            }

            if (scale.match(/.*?week.*?/)) {
                return 150 * zoom;
            }

            if (scale.match(/.*?month.*?/)) {
                return 300 * zoom;
            }

            if (scale.match(/.*?quarter.*?/)) {
                return 500 * zoom;
            }

            if (scale.match(/.*?year.*?/)) {
                return 800 * zoom;
            }

            return 60 * zoom;
        };

        // Reload data action
        $scope.load = function() {
            console.log('***Load');
            $scope.data = Sample.getSampleData();
            dataToRemove = undefined;

            //$scope.timespans = Sample.getSampleTimespans();
        };

        $scope.reload = function() {
            console.log('***Reload');
            $scope.load();
        };

        // Remove data action
        $scope.remove = function() {
            $scope.api.data.remove(dataToRemove);
            $scope.api.dependencies.refresh();
        };

        // Clear data action
        $scope.clear = function() {
            $scope.data = [];
        };

        // Add data to target row index
        $scope.addOverlapTaskToTargetRowIndex = function() {
            var targetDataAddRowIndex = parseInt($scope.options.targetDataAddRowIndex);

            if (targetDataAddRowIndex) {
                var targetRow = $scope.data[$scope.options.targetDataAddRowIndex];

                if (targetRow && targetRow.tasks && targetRow.tasks.length > 0) {
                    var firstTaskInRow = targetRow.tasks[0];
                    var copiedColor = firstTaskInRow.color;
                    var firstTaskEndDate = firstTaskInRow.to.toDate();
                    var overlappingFromDate = new Date(firstTaskEndDate);

                    overlappingFromDate.setDate(overlappingFromDate.getDate() - 1);

                    var overlappingToDate = new Date(overlappingFromDate);

                    overlappingToDate.setDate(overlappingToDate.getDate() + 7);

                    targetRow.tasks.push({
                        'name': 'Overlapping',
                        'from': overlappingFromDate,
                        'to': overlappingToDate,
                        'color': copiedColor
                    });
                }
            }
        };


        // Visual two way binding.
        $scope.live = {};

        var debounceValue = 1000;

        var listenTaskJson = debounce(function(taskJson) {
            if (taskJson !== undefined) {
                var task = angular.fromJson(taskJson);
                objectModel.cleanTask(task);
                var model = $scope.live.task;
                angular.extend(model, task);
            }
        }, debounceValue);
        $scope.$watch('live.taskJson', listenTaskJson);

        var listenRowJson = debounce(function(rowJson) {
            if (rowJson !== undefined) {
                var row = angular.fromJson(rowJson);
                objectModel.cleanRow(row);
                var tasks = row.tasks;

                delete row.tasks;
                delete row.drawTask;

                var rowModel = $scope.live.row;

                angular.extend(rowModel, row);

                var newTasks = {};
                var i, l;

                if (tasks !== undefined) {
                    for (i = 0, l = tasks.length; i < l; i++) {
                        objectModel.cleanTask(tasks[i]);
                    }

                    for (i = 0, l = tasks.length; i < l; i++) {
                        newTasks[tasks[i].id] = tasks[i];
                    }

                    if (rowModel.tasks === undefined) {
                        rowModel.tasks = [];
                    }
                    for (i = rowModel.tasks.length - 1; i >= 0; i--) {
                        var existingTask = rowModel.tasks[i];
                        var newTask = newTasks[existingTask.id];
                        if (newTask === undefined) {
                            rowModel.tasks.splice(i, 1);
                        } else {
                            objectModel.cleanTask(newTask);
                            angular.extend(existingTask, newTask);
                            delete newTasks[existingTask.id];
                        }
                    }
                } else {
                    delete rowModel.tasks;
                }

                angular.forEach(newTasks, function(newTask) {
                    rowModel.tasks.push(newTask);
                });
            }
        }, debounceValue);
        $scope.$watch('live.rowJson', listenRowJson);

        $scope.$watchCollection('live.task', function(task) {
            $scope.live.taskJson = angular.toJson(task, true);
            $scope.live.rowJson = angular.toJson($scope.live.row, true);
        });

        $scope.$watchCollection('live.row', function(row) {
            $scope.live.rowJson = angular.toJson(row, true);
            if (row !== undefined && row.tasks !== undefined && row.tasks.indexOf($scope.live.task) < 0) {
                $scope.live.task = row.tasks[0];
            }
        });

        $scope.$watchCollection('live.row.tasks', function() {
            $scope.live.rowJson = angular.toJson($scope.live.row, true);
        });


    }]);

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
