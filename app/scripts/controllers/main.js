'use strict';

/**
 * @ngdoc function
 * @name angularGanttDemoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularGanttDemoApp
 */
angular.module('angularGanttDemoApp')
    .controller('MainCtrl', [
      '$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel',
      'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment',
      '$modal', '$popover', function(
        $scope, $timeout, $log, utils, ObjectModel, Sample,
        mouseOffset, debounce, moment,
        $modal, $popover
      ) {
        var objectModel;
        var dataToRemove;
        var firstLoad = true;
        var targetDay = moment(new Date(2016, 11, 15, 11, 20, 0));

        // Event handler
        var logScrollEvent = function(left, date, direction) {
            if (date !== undefined) {
                $log.info('[Event] api.on.scroll: ' + left + ', ' + (date === undefined ? 'undefined' : date.format()) + ', ' + direction);
            }
        };

        // popoverパラメータ
        $scope.pops = {
          fromDate: new Date(2016, 11, 15, 8, 30, 0),
          fromRadio: 0,
          toDate: new Date(2016, 11, 15, 9, 30, 0),
          toRadio: 0,
          addFlg: true,
          instance: undefined,
          row: undefined,
          task: undefined,
          addFunc: function () {
            var ft = moment($scope.pops.fromDate);
            var tt = moment($scope.pops.toDate);

            ft.day($scope.pops.fromRadio === 0 ? targetDay.day() : targetDay.day() + 1);
            tt.day($scope.pops.toRadio === 0 ? targetDay.day() : targetDay.day() + 1);

            $scope.pops.row.model.tasks.push({
              'name': $scope.pops.row.model.name,
              'color': '#90EE90',
              'from': ft,
              'to': tt,
              'workmin': tt.diff(ft, 'm')
            });
          },
          chgFunc: function () {
            var ft = moment($scope.pops.fromDate);
            var tt = moment($scope.pops.toDate);

            ft.day($scope.pops.fromRadio === 0 ? targetDay.day() : targetDay.day() + 1);
            tt.day($scope.pops.toRadio === 0 ? targetDay.day() : targetDay.day() + 1);

            $scope.pops.task.from = ft;
            $scope.pops.task.to = tt;

            console.log('TaskChange-Task:' + ft.format('HH:mm') + '-' + tt.format('HH:mm'));
          },
          delFunc: function () {
            /*
            var ft = moment($scope.pops.fromDate);
            var tt = moment($scope.pops.toDate);
            console.log('TaskDel-Task:' + ft.format('HH:mm') + '-' + tt.format('HH:mm'));
            */
            for (var i = 0; i < $scope.pops.row.model.tasks.length; i++) {
              if ($scope.pops.row.model.tasks[i].id == $scope.pops.task.id) {
                $scope.pops.row.model.tasks.splice(i, 1);
                break;
              }
            }
          }
        };

        // popoover作成
        var createPopover = function (element, row, bolRegist, taskModel) {
          // 作成済みならリターン
          if ($scope.pops.instance !== undefined) {
            return;
          }
          $scope.pops.addFlg = bolRegist;
          if (bolRegist) {
            var tmpNow = moment(Date.Now);
            var tmpStart = targetDay;
            var tmpEnd;

            tmpStart.hour(tmpNow.hour());
            tmpStart.minute(tmpNow.minute());
            tmpStart.second(0);

            console.log('tmpStart.minute()=' + tmpStart.minute());
            tmpStart.minute(Math.floor(tmpStart.minute() / 15) * 15);
            console.log('tmpStart.minute()=' + tmpStart.minute());
            $scope.pops.fromDate = tmpStart;
            tmpEnd = tmpStart.clone();
            tmpEnd.add(1, 'h');
            $scope.pops.toDate = tmpEnd;
          }
          else {
            $scope.pops.fromDate = taskModel.from;
            $scope.pops.toDate = taskModel.to;
            $scope.pops.fromRadio  = (taskModel.from.day() === targetDay.day()) ? 0 : 1;
            $scope.pops.toRadio  = (taskModel.to.day() === targetDay.day()) ? 0 : 1;
          }
          $scope.pops.row = row;
          $scope.pops.task = taskModel;

          $scope.pops.instance = $popover(element, {
            animation: 'am-flip-x',
            autoClose: true,
            placement: 'right auto',
            title: (bolRegist ? '作業時間登録' : '作業時間更新'),
            content: 'OK',
            templateUrl: 'template/P002_registration.html',
            trigger: 'manual',
            container: 'body',
            onShow: function (e) {
              console.log('show');
              console.log(e);
            },
            onHide: function (e) {
              console.log('hide');
              console.log(e);
              $scope.pops.instance = undefined;
            }
          });
          // popover作成完了後に表示
          $scope.pops.instance.$promise.then(function () {
            $scope.pops.instance.show();
            console.log($scope.pops.instance.$scope);
            // popoverのスコープにパラメータを設定
            $scope.pops.instance.$scope.pops = $scope.pops;
          });
          console.log(row.model.id);
        };

        // Event handler
        var logDataEvent = function(eventName) {
            $log.info('[Event] ' + eventName);
            //console.log('logDataEvent');
            $timeout(function () {
              $scope.collapseAll();
              $scope.api.tree.expand('1');
              //$('.gantt-scrollable').scrollLeft(480);
              angular.element(document.getElementsByClassName('gantt-table-content')).attr('style', 'border-left: 2px solid #dddddd;');
              angular.element(document.getElementsByClassName('gantt-row-label-header')).attr('style', 'border-left: 2px solid #dddddd;');
              angular.element(document.getElementsByClassName('gantt-tree-body')).attr('style', 'border-left: 2px solid #dddddd;');
              document.oncontextmenu = function() {
                return false;
              };
              firstLoad = false;
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
            //console.log(row.tasks[0].model.from);
            //console.log(row.tasks[0].model.to);
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

        $scope.rowcheck = [];
        $scope.taskcheck = [];

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
            currentDateValue: targetDay,
            draw: true,
            readOnly: false,
            groupDisplayMode: 'none',//'group',
            filterTask: '',
            filterRow: '',
            columnMagnet: '15 minutes',
            dependencies: false,
            targetDataAddRowIndex: 4,
            canDraw: function(event) {
                var isLeftMouseButton = event.button === 0 || event.button === 1;
                return $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
            },
            drawTaskFactory: function() {
                return {
                    id: utils.randomUuid(),  // Unique id of the task.
                    name: 'Drawn task', // Name shown on top of each task.
                    color: '#90EE90' // Color of the task in HEX format (Optional).
                };
            },
            api: function(api) {
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

                api.core.on.ready($scope, function() {
                    // Log various events to console
                    api.scroll.on.scroll($scope, logScrollEvent);
                    api.core.on.ready($scope, logReadyEvent);

                    api.data.on.remove($scope, addEventName('data.on.remove', logDataEvent));
                    api.data.on.load($scope, addEventName('data.on.load', logDataEvent));
                    api.data.on.clear($scope, addEventName('data.on.clear', logDataEvent));
                    api.data.on.change($scope, addEventName('data.on.change', logDataEvent));

                    api.tasks.on.add($scope, addEventName('tasks.on.add', logTaskEvent));
                    //api.tasks.on.change($scope, addEventName('tasks.on.change', logTaskEvent));
                    api.tasks.on.change($scope, function (newData) {
                      if (newData.model.name !== newData.row.model.name) {
                          newData.model.name = newData.row.model.name;
                      }
                    });
                    api.tasks.on.rowChange($scope, addEventName('tasks.on.rowChange', logTaskEvent));
                    api.tasks.on.remove($scope, addEventName('tasks.on.remove', logTaskEvent));

                    if (api.tasks.on.moveBegin) {
                        api.tasks.on.moveBegin($scope, addEventName('tasks.on.moveBegin', logTaskEvent));
                        //api.tasks.on.move($scope, addEventName('tasks.on.move', logTaskEvent));
                        api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', logTaskEvent));

                        api.tasks.on.resizeBegin($scope, addEventName('tasks.on.resizeBegin', logTaskEvent));
                        //api.tasks.on.resize($scope, addEventName('tasks.on.resize', logTaskEvent));
                        //api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', logTaskEvent));
                        api.tasks.on.resizeEnd($scope, function (newTask) {
                          console.log('resizeEnd:newTask.model.from=' + newTask.model.from + ',newTask.model.to=' + newTask.model.to);
                        });
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

                    api.data.on.change($scope, function() {
                        //console.log(newData);
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

                            // コンテキストメニュー設定
                            element.bind('contextmenu', function() {
                                createPopover(element, directiveScope.task.row, false, directiveScope.task.model);
                                return false;
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
                            // clickイベント
                            element.bind('click', function(event) {
                                event.stopPropagation();
                                logRowEvent('row-label-click', directiveScope.row, event);
                            });

                            if (element[0].nodeName === 'SPAN' && directiveScope.row && directiveScope.row.model) {
                              if (directiveScope.row.model.drawTask === false) {
                                // タスク設定出来ない行
                              }
                              else {
                                // コンテキストメニュー設定
                                if ($scope.rowcheck.includes(directiveScope.row.model) === false) {
                                  // コンテキストメニューの設定が済んでいない行を対象
                                  $scope.rowcheck.push(directiveScope.row.model);
                                  element.bind('contextmenu', function(e) {
                                      createPopover(angular.element(e.currentTarget), directiveScope.row, true, undefined);
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
            $scope.rowcheck = [];

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
                console.log('pass-1');
                var row = angular.fromJson(rowJson);
                objectModel.cleanRow(row);
                var tasks = row.tasks;
                console.log(tasks);

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
                            console.log('undef=' + existingTask.id);
                            rowModel.tasks.splice(i, 1);
                        } else {
                            console.log('exists=' + existingTask.id);
                            objectModel.cleanTask(newTask);
                            //angular.extend(existingTask, newTask);
                            angular.extend(newTask, existingTask);
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
