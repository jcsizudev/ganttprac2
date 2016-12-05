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
    'mgcrea.ngStrap',
    'ui.select'
]).config(['$compileProvider', 'uiSelectConfig', function($compileProvider, uiSelectConfig) {
    $compileProvider.debugInfoEnabled(false); // Remove debug info (angularJS >= 1.3)
    //treeConfig.defaultCollapsed = true;
    uiSelectConfig.theme = 'bootstrap';
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
    .controller('MainCtrl', [
      '$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel',
      'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment',
      '$modal', '$popover', 'TaskDateCheck', '$alert', function(
        $scope, $timeout, $log, utils, ObjectModel, Sample,
        mouseOffset, debounce, moment,
        $modal, $popover, TaskDateCheck, $alert
      ) {
        var objectModel;
        var dataToRemove;
        var targetDay = moment(new Date(2016, 11, 15, 11, 20, 0));

        // Event handler
        var logScrollEvent = function(left, date, direction) {
            if (date !== undefined) {
                $log.info('[Event] api.on.scroll: ' + left + ', ' + (date === undefined ? 'undefined' : date.format()) + ', ' + direction);
            }
        };

        $scope.rowcheck = [];   // 行イベント重複登録回避用
        $scope.onDrawing = false; // タスク描画中フラグ
        $scope.mvTargetRow = undefined; // 移動対象タスクの元の行
        $scope.mvTargetPos = undefined; // 移送対象タスクのfrom～to
        $scope.summaryRow = undefined;  // 時間合計行

        // タスク編集画面用時間リスト
        var hourList = [];
        var getHourList = function () {
          if (hourList.length === 0) {
            for (var i = 0; i < 37; i++) {
              hourList.push({id: i + '', name: i + ''});
            }
          }
          return hourList;
        };
        // タスク編集画面用分リスト
        var minuteList = [];
        var getMinuteList = function () {
          console.log(minuteList);
          if (minuteList.length === 0) {
            // マスタ設定による
            minuteList.push({id: '0', name: '0'});
            minuteList.push({id: '15', name: '15'});
            minuteList.push({id: '30', name: '30'});
            minuteList.push({id: '45', name: '45'});
          }
          return minuteList;
        };

        // 分操作
        var setWorkMinutes = function (row, oldmin, newmin) {
          console.log('setWorkMinutes(' + row.model.name + ':' + row.model.id +')=(' + oldmin + ',' + newmin +')');
          // 変更前の時間を減算
          row.model.workmin = (row.model.workmin === undefined) ? 0 : row.model.workmin;
          row.model.workmin -= oldmin;
          $scope.summaryRow.workmin = ($scope.summaryRow.workmin === undefined) ? 0 : $scope.summaryRow.workmin;
          $scope.summaryRow.workmin -= oldmin;

          // 変更後の時間を加算
          row.model.workmin += newmin;
          $scope.summaryRow.workmin += newmin;

          // 時間が0の場合は非表示化
          row.model.workmin = (row.model.workmin === 0) ? undefined : row.model.workmin;
          $scope.summaryRow.workmin = ($scope.summaryRow.workmin === 0) ? undefined : $scope.summaryRow.workmin;
        };

        // タスク操作
        var deleteTask = function (row, task) {
          // 重なりチェックデータからタスクを削除
          TaskDateCheck.delTask(task.id);
          for (var i = 0; i < row.model.tasks.length; i++) {
            if (row.model.tasks[i].id === task.id) {
              var workMin = task.workmin;
              // タスク時間を削除
              setWorkMinutes(row, workMin, 0);
              //画面データからタスクを削除
              row.model.tasks.splice(i, 1);
              break;
            }
          }
        };

        var resizeTask = function (task, from, to) {
          task.from = from;
          task.to = to;
          task.workmin = to.diff(from, 'm');
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
          fHour: undefined,
          fMinute: undefined,
          tHour: undefined,
          tMinute: undefined,
          hours: getHourList(),
          minutes: getMinuteList(),
          alert: function (message, container) {
            $alert({
              title: '',
              content: message,
              placement: 'top',
              type: 'danger',
              show: true,
              container: container,
              duration: 3
            });
          },
          getCheckedDate: function (h, m) {
            var tmpDay = targetDay.clone();
            var hh;
            var mm;

            // パラメータチェック
            if (h === undefined || m === undefined || h.name === undefined || m.name === undefined) {
              return undefined;
            }

            // 数値変換
            hh = (h.name + '').match(/[0-9]?/) ? h.name - 0 : undefined;
            mm = (m.name + '').match(/[0-9]?/) ? m.name - 0 : undefined;

            // 数値変換失敗
            if (hh === undefined || mm === undefined) {
              return undefined;
            }

            // 数値範囲外
            if (hh < 0 || hh > 36 || mm < 0 || mm > 59) {
              return undefined;
            }

            // 日付調整
            if (hh > 23) {
              tmpDay.add(1,'d');
              hh -= 24;
            }

            // 返却日時作成
            tmpDay.hour(hh);
            tmpDay.minute(mm);

            return tmpDay;
          },
          checkFromTo: function (ft, tt, chekedFromTo) {
            if (ft === undefined || tt === undefined) {
              $scope.pops.alert('時間は0～36、分は0～59を指定して下さい。', 'div.popover-message-area');
              return false;
            }

            if (ft.isSameOrAfter(tt)) {
              $scope.pops.alert('開始～終了範囲に誤りがあります。', 'div.popover-message-area');
              return false;
            }

            if (chekedFromTo === undefined) {
              $scope.pops.alert('就業時間外か、他のタスクと重なる日時が指定されました。', 'div.popover-message-area');
              return false;
            }
            return true;
          },
          // タスク追加を選択
          addFunc: function (close) {
            console.log('addFunc:' + close);
            // ドロップダウンの選択からfrom～toを決定、uuidは新規に追加
            var ft = $scope.pops.getCheckedDate($scope.pops.fHour, $scope.pops.fMinute);
            var tt = $scope.pops.getCheckedDate($scope.pops.tHour, $scope.pops.tMinute);
            var uuid = utils.randomUuid();

            // ドロップダウンでの選択時間範囲のチェックと調整
            var fromTo = TaskDateCheck.getAdjutedFromTo(uuid, ft, tt);
            if (!$scope.pops.checkFromTo(ft, tt, fromTo)) {
              return;
            }

            // 重なりチェックデータに新規タスクを追加
            TaskDateCheck.addTask(uuid, fromTo.from, fromTo.to);

            // 画面データに新規タスクを追加
            $scope.pops.row.model.tasks.push({
              'id': uuid,
              'name': $scope.pops.row.model.name,
              'color': '#90EE90',
              'from': fromTo.from,
              'to': fromTo.to,
              'workmin': fromTo.to.diff(fromTo.from, 'm'),
              'isPopOverTask': true // ポップオーバーで追加したタスク→onAddで再処理しないようにする
            });

            // 行の作業時間サマリを更新
            setWorkMinutes($scope.pops.row, 0, fromTo.to.diff(fromTo.from, 'm'));
            if (close === true) {
              // 連続追加でなければポップオーバーをクローズ
              $scope.pops.instance.hide();
            }
          },
          // タスク更新を選択
          chgFunc: function () {
            // 変更前の時間範囲を取得、ドロップダウンの選択からfrom～toを決定
            var oldFromTo = TaskDateCheck.getFromToById($scope.pops.task.id);
            var ft = $scope.pops.getCheckedDate($scope.pops.fHour, $scope.pops.fMinute);
            var tt = $scope.pops.getCheckedDate($scope.pops.tHour, $scope.pops.tMinute);

            // ドロップダウンでの選択時間範囲のチェックと調整
            var fromTo = TaskDateCheck.getAdjutedFromTo($scope.pops.task.id, ft, tt);
            if (!$scope.pops.checkFromTo(ft, tt, fromTo)) {
              return;
            }

            // 重なりチェックデータにタスクを変更
            TaskDateCheck.chgTask($scope.pops.task.id, fromTo.from, fromTo.to);

            // 画面データのタスクを変更
            resizeTask($scope.pops.task, fromTo.from, fromTo.to);

            // 行の作業時間サマリを更新
            setWorkMinutes($scope.pops.row, oldFromTo.to.diff(oldFromTo.from, 'm'), fromTo.to.diff(fromTo.from, 'm'));

            // ポップオーバークローズ
            $scope.pops.instance.hide();
          },
          // タスク削除を選択
          delFunc: function () {
            // タスク削除
            deleteTask($scope.pops.row, $scope.pops.task);

            // ポップオーバークローズ
            $scope.pops.instance.hide();
          }
        };

        // popoover作成
        var createPopover = function (element, row, bolRegist, taskModel) {
          // ポップオーバー画面が作成済みならリターン
          if ($scope.pops.instance !== undefined) {
            return;
          }

          // ポップオーバーパラメータの設定
          $scope.pops.addFlg = bolRegist; // 追加フラグを設定（追加画面か編集画面かの切り替え用）
          if (bolRegist) {
            // 追加時は開始～終了時間を未設定状態に
            $scope.pops.fHour = undefined;
            $scope.pops.fMinute = undefined;
            $scope.pops.tHour = undefined;
            $scope.pops.tMinute = undefined;
          }
          else {
            // 変更時は開始～終了時間を設定
            var fh = (taskModel.from.day() === targetDay.day()) ? taskModel.from.hour() : taskModel.from.hour() + 24;
            var fm = taskModel.from.minute();
            var th = (taskModel.to.day() === targetDay.day()) ? taskModel.to.hour() : taskModel.to.hour() + 24;
            var tm = taskModel.to.minute();
            $scope.pops.fHour = {id: fh + '', name: fh + ''};
            $scope.pops.fMinute = {id: fm + '', name: fm + ''};
            $scope.pops.tHour = {id: th + '', name: th + ''};
            $scope.pops.tMinute = {id: tm + '', name: tm + ''};
          }
          $scope.pops.row = row;  // 対象タスクの行
          $scope.pops.task = taskModel; // 対象タスク

          // ポップオーバー画面作成
          $scope.pops.instance = $popover(element, {
            animation: 'am-flip-x',
            autoClose: true,
            placement: 'right auto',
            title: (bolRegist ? '作業時間登録' : '作業時間更新'),
            content: 'OK',
            templateUrl: 'template/P002_registration.html',
            trigger: 'manual',
            container: 'body',
            onShow: function () {
              console.log('popover-show');
            },
            onHide: function () {
              console.log('popover-hide');
              $scope.pops.instance = undefined;
            }
          });
          // popover作成完了後に表示
          $scope.pops.instance.$promise.then(function () {
            $scope.pops.instance.show();
            // popoverのスコープにパラメータを設定
            $scope.pops.instance.$scope.pops = $scope.pops;
          });
        };

        // Event handler
        var logDataEvent = function(eventName) {
            $log.info('[Event] ' + eventName);
        };

        // データロード後のイベント
        var onDataLoadEvent = function(eventName) {
          $log.info('[Event] ' + eventName);
          $timeout(function () {
            $scope.collapseAll(); // 全ノードを一旦畳む
            $scope.api.tree.expand('1');  // 先頭ノードのみ開く※パラメータによる
            //$('.gantt-scrollable').scrollLeft(480);

            // 表の罫線設定（作業時間左）
            angular.element(document.getElementsByClassName('gantt-table-content')).attr('style', 'border-left: 2px solid #dddddd;');
            angular.element(document.getElementsByClassName('gantt-row-label-header')).attr('style', 'border-left: 2px solid #dddddd;');
            angular.element(document.getElementsByClassName('gantt-tree-body')).attr('style', 'border-left: 2px solid #dddddd;');
            // コンテキストメニューは無効化
            document.oncontextmenu = function() {
              return false;
            };
          }, 500);
        };

        // Event handler
        var logTaskEvent = function(eventName, task) {
            $log.info('[Event] ' + eventName + ': ' + task.model.name);
        };

        var taskAdd = function(eventName, task) {
          $log.info('[Event] ' + eventName + ': ' + task.model.name);

          // ポップオーバー画面で追加した直後のタスクは再処理しない
          if (task.model.isPopOverTask !== undefined && task.model.isPopOverTask === true) {
            console.log('AddedByPopOver:' + task.model.id);
            task.model.isPopOverTask = false;
            return;
          }

          // タスク描画中でない場合のみ追加
          if ($scope.onDrawing === false) {
            console.log('-描画中でない')
            // 日時調整タスク追加
            var planWork = (task.model.planWork !== undefined);
            var actualWork = (task.model.actualWork !== undefined);
            var fromTo = TaskDateCheck.getAdjutedFromTo(task.model.id, task.model.from, task.model.to);
            if (fromTo === undefined) {
              // 追加できない日時→削除
              deleteTask(task.row, task.model);
              $scope.$applyAsync();
            }
            else {
              // 調整済みの日時で追加
              TaskDateCheck.addTask(task.model.id, fromTo.from, fromTo.to, planWork, actualWork);
              resizeTask(task.model, fromTo.from, fromTo.to);
              $scope.$applyAsync();
            }
          }
          else {
            console.log('-描画中')
          }
        };

        var taskDrawEnd = function(eventName, task) {
            $log.info('[Event] ' + eventName + ': ' + task.model.name);

            // 描画中フラグリセット
            if ($scope.onDrawing === true) {
              console.log('-描画完了');
              $scope.onDrawing = false;
            }

        };

        var taskResizeEnd = function(eventName, task) {
          $log.info('[Event] ' + eventName + ': ' + task.model.name);
          // 日時調整タスク追加
          var oldFromTo = TaskDateCheck.getFromToById(task.model.id);
          var fromTo = TaskDateCheck.getAdjutedFromTo(task.model.id, task.model.from, task.model.to);
          if (fromTo === undefined) {
            // 追加できない日時→削除
            console.log('-追加不可');
            deleteTask(task.row, task.model);
            $scope.$applyAsync();
          }
          else {
            // 調整済みの日時で追加
            if (oldFromTo === undefined) {
              console.log('-追加');
              TaskDateCheck.addTask(task.model.id, fromTo.from, fromTo.to, false, false);
              setWorkMinutes(task.row, 0, fromTo.to.diff(fromTo.from, 'm'));
            }
            else {
              console.log('-変更');
              TaskDateCheck.chgTask(task.model.id, fromTo.from, fromTo.to);
              setWorkMinutes(task.row, oldFromTo.to.diff(oldFromTo.from, 'm'), fromTo.to.diff(fromTo.from, 'm'));
            }
            resizeTask(task.model, fromTo.from, fromTo.to);
            $scope.$applyAsync();
          }
        };

        var taskMoveBegin = function(eventName, task) {
          $log.info('[Event] ' + eventName + ': ' + task.model.name);
          $scope.mvTargetRow = task.row;
          $scope.mvTargetPos = TaskDateCheck.getFromToById(task.model.id);
          console.log($scope.mvTargetRow);
          console.log($scope.mvTargetPos);
        };

        var taskMoveEnd = function(eventName, task) {
          $log.info('[Event] ' + eventName + ': ' + task.model.name);

          var fromTo = TaskDateCheck.getAdjutedFromTo(task.model.id, task.model.from, task.model.to);
          if (fromTo === undefined) {
            if ($scope.mvTargetPos !== undefined) {
              resizeTask(task.model, $scope.mvTargetPos.from, $scope.mvTargetPos.to);
              $scope.mvTargetRow.moveTaskToRow(task);
              console.log('移動不可-戻し');
            }
            else {
              deleteTask(task.row, task.model);
              console.log('移動不可-削除');
            }
          }
          else {
            TaskDateCheck.chgTask(task.model.id, fromTo.from, fromTo.to);
            setWorkMinutes($scope.mvTargetRow, $scope.mvTargetPos.to.diff($scope.mvTargetPos.from, 'm'), 0);
            setWorkMinutes(task.row, 0, fromTo.to.diff(fromTo.from, 'm'));
            resizeTask(task.model, fromTo.from, fromTo.to);
            $scope.$applyAsync();
            console.log('移動可');
          }
          $scope.mvTargetPos = undefined;
          $scope.mvTargetRow = undefined;
        };

        var taskChange = function(eventName, task) {
          $log.info('[Event] ' + eventName + ': ' + task.model.name);
          if (task.model.name !== task.row.model.name) {
              task.model.name = task.row.model.name;
          }
        };

        // Event handler
        var logRowEvent = function(eventName, row) {
            $log.info('[Event] ' + eventName + ': ' + row.model.name);
        };

        //
        var onRowAdd = function(eventName, row) {
            $log.info('[Event] ' + eventName + ': ' + row.model.name);
            // 時間集計行をセット
            if (row.model.workSummary !== undefined) {
              console.log('summaryRow-set');
              $scope.summaryRow = row.model;
            }
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


        // angular-gantt options
        $scope.options = {
            mode: 'custom',
            scale: '1 hour',
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
            toDate: moment(new Date(2016, 11, 15, 23, 0, 0)),
            rowContent: '<i class="fa fa-align-justify"></i> {{row.model.name}}',
            taskContent : '<i class="fa fa-tasks"></i> {{task.model.name}}',
            allowSideResizing: false,
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
                    //api.data.on.load($scope, addEventName('data.on.load', logDataEvent));
                    api.data.on.load($scope, addEventName('data.on.load', onDataLoadEvent));
                    api.data.on.clear($scope, addEventName('data.on.clear', logDataEvent));
                    api.data.on.change($scope, addEventName('data.on.change', logDataEvent));

                    //api.tasks.on.add($scope, addEventName('tasks.on.add', logTaskEvent));
                    api.tasks.on.add($scope, addEventName('tasks.on.add', taskAdd));
                    //api.tasks.on.change($scope, addEventName('tasks.on.change', logTaskEvent));
                    api.tasks.on.change($scope, addEventName('tasks.on.change', taskChange));
                    /*
                    api.tasks.on.change($scope, function (newData) {
                      if (newData.model.name !== newData.row.model.name) {
                          newData.model.name = newData.row.model.name;
                      }
                    });
                    */
                    api.tasks.on.rowChange($scope, addEventName('tasks.on.rowChange', logTaskEvent));
                    api.tasks.on.remove($scope, addEventName('tasks.on.remove', logTaskEvent));

                    if (api.tasks.on.moveBegin) {
                        //api.tasks.on.moveBegin($scope, addEventName('tasks.on.moveBegin', logTaskEvent));
                        api.tasks.on.moveBegin($scope, addEventName('tasks.on.moveBegin', taskMoveBegin));
                        //api.tasks.on.move($scope, addEventName('tasks.on.move', logTaskEvent));
                        //api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', logTaskEvent));
                        api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', taskMoveEnd));

                        api.tasks.on.resizeBegin($scope, addEventName('tasks.on.resizeBegin', logTaskEvent));
                        //api.tasks.on.resize($scope, addEventName('tasks.on.resize', logTaskEvent));
                        //api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', logTaskEvent));
                        api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', taskResizeEnd));
                    }

                    if (api.tasks.on.drawBegin) {
                        api.tasks.on.drawBegin($scope, addEventName('tasks.on.drawBegin', logTaskEvent));
                        //api.tasks.on.draw($scope, addEventName('tasks.on.draw', logTaskEvent));
                        //api.tasks.on.drawEnd($scope, addEventName('tasks.on.drawEnd', logTaskEvent));
                        api.tasks.on.drawEnd($scope, addEventName('tasks.on.drawEnd', taskDrawEnd));
                    }

                    //api.rows.on.add($scope, addEventName('rows.on.add', logRowEvent));
                    api.rows.on.add($scope, addEventName('rows.on.add', onRowAdd));
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
                                TaskDateCheck.dumpTask();
                            });

                            // コンテキストメニュー設定
                            element.bind('contextmenu', function() {
                                createPopover(element, directiveScope.task.row, false, directiveScope.task.model);
                                return false;
                            });

                            element.bind('mousedown touchstart', function(event) {
                                event.stopPropagation();
                                /*
                                $scope.live.row = directiveScope.task.row.model;
                                if (directiveScope.task.originalModel !== undefined) {
                                    $scope.live.task = directiveScope.task.originalModel;
                                } else {
                                    $scope.live.task = directiveScope.task.model;
                                }
                                */
                                $scope.$digest();
                            });
                        } else if (directiveName === 'ganttRow') {
                            element.bind('click', function(event) {
                                event.stopPropagation();
                                logRowEvent('row-click', directiveScope.row);
                            });
                            element.bind('mousedown touchstart', function(event) {
                                $scope.onDrawing = true;
                                event.stopPropagation();
                                //$scope.live.row = directiveScope.row.model;
                                console.log('touch start!');
                                $scope.$digest();
                            });
                        } else if (directiveName === 'ganttRowLabel') {
                            // clickイベント
                            element.bind('click', function(event) {
                                event.stopPropagation();
                                logRowEvent('row-label-click', directiveScope.row);
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
                                else {
                                  console.log('行重複パターン！');
                                }
                              }
                            }

                            //element.bind('mousedown touchstart', function() {
                                //$scope.live.row = directiveScope.row.model;
                                //$scope.$digest();
                            //});
                        }
                    });

                    //api.tasks.on.rowChange($scope, function() {
                        //$scope.live.row = task.row.model;
                    //});

                    objectModel = new ObjectModel(api);
                });
            }
        };

        $scope.headersFormats = {
          hour: 'HH:mm',
          day: 'MM月DD日'
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
                            movable: false,
                            planWork: true
                          }
                        ]},
                        {name: '就業実績', sortable: false, drawTask: false, color: '#E0FFFF', tasks: [
                          {
                            id: '51',
                            name: '',
                            color: '#6495ED',
                            from: new Date(2016, 11, 15, 8, 0, 0),
                            to: new Date(2016, 11, 15, 20, 30, 0),
                            movable: false,
                            actualWork: true
                          }
                        ]},
                        {name: '', id: '0', workmin: 150, drawTask: false, color: '#E0FFFF', workSummary: true, tasks: []},
                        {name: '製造所', id: '1', drawTask: false, color: '#FFFAC2', tasks: []},
                        {name: '荷卸し', id: '10', parent: '1', workmin: 60, tasks: [
                          {
                              id: '100',
                              name: '荷卸し',
                              color: '#90EE90',
                              from: new Date(2016, 11, 15, 8, 0, 0),
                              to: new Date(2016, 11, 15, 9, 0, 0),
                              workmin: 60,
                          }
                        ]},
                        {name: '入荷検品', id: '11', parent: '1', workmin: 90, tasks: [
                          {
                              id: '101',
                              name: '入荷検品',
                              color: '#90EE90',
                              from: new Date(2016, 11, 15, 9, 0, 0),
                              to: new Date(2016, 11, 15, 10, 30, 0),
                              workmin: 90,
                          }
                        ]},
                        {name: '荷役（入荷）', id: '12', parent: '1', workmin: undefined, tasks: []},
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
    .service('TaskDateCheck', ['moment', function TaskDateCheck(moment) {
      var taskList = [];

      var adjustDate = function (id, from, to) {
        var mfrom;
        var mto;
        var err = false;

        // パラメータチェック
        if (from === undefined || to === undefined) {
          return undefined;
        }

        // fromとtoの設定
        mfrom = moment.isMoment(from) ? from : moment(from);
        mto = moment.isMoment(to) ? to : moment(to);

        // 他タスクとの重複や実績時間範囲外のチェックと調整
        angular.forEach(taskList, function (task) {
          if (task.actualWork === true) {
            // 実績時間内かどうかのチェック
            if (mfrom.isBefore(task.to) && mto.isAfter(task.from)) {
              if (mfrom.isBefore(task.from) && mto.isAfter(task.from)) {
                //左かけ
                mfrom = task.from.clone();
                console.log('実績-左かけ');
              }
              else if (mfrom.isBefore(task.to) && mto.isAfter(task.to)) {
                //右かけ
                mto = task.to.clone();
                console.log('実績-右かけ');
              }
              else {
                // 完全包含では調整不要
                console.log('実績-包含');
              }
            }
            else {
              // 完全に実績時間外
              console.log('実績-時間外');
              err = true;
            }
          }
          else if (id !== task.id && task.planWork === false) {
            // 他タスクとの重複のチェック
            if (mfrom.isBefore(task.to) && mto.isAfter(task.from)) {
              if (mfrom.isBefore(task.from) && mto.isAfter(task.from)) {
                //左かけ
                mto = task.from.clone();
                console.log('他タスク-左かけ');
              }
              else if (mfrom.isBefore(task.to) && mto.isAfter(task.to)) {
                //右かけ
                mfrom = task.to.clone();
                console.log('他タスク-右かけ');
              }
              else {
                //完全包含では調整不可
                console.log('他タスク-包含');
                err = true;
              }
            }
            else {
              // 他タスクと重なりなし
              console.log('他タスク-重なりなし');
            }
          }
          else {
            //チェック対象外タスク
            console.log('チェック対象外');
          }
        });

        // エラー検出
        if (err) {
          return undefined;
        }

        return {
          'from': mfrom,
          'to': mto
        };
      };

      var logPrint = function () {
        var message = arguments[0] + '(';
        for (var i = 1; i < arguments.length; i++) {
          if (i > 1) {
            message += ',';
          }
          if (moment.isMoment(arguments[i])) {
            message += arguments[i].format('HH:mm');
          }
          else {
            message += arguments[i];
          }
        }
        message += ')';
        console.log(message);
      };

      return {
        getAdjutedFromTo: function(id, from, to) {
          var fromTo;

          logPrint('TaskDateCheck.getAdjutedFromTo<-', id, from, to);
          fromTo = adjustDate(id, from, to);
          if (fromTo !== undefined) {
            logPrint('TaskDateCheck.getAdjutedFromTo->', fromTo.from, fromTo.to);
            return {
              'from': fromTo.from.clone(),
              'to': fromTo.to.clone()
            };
          }
          logPrint('TaskDateCheck.getAdjutedFromTo->', 'undefined');
          return undefined;
        },
        addTask: function(id, from, to, planWork, actualWork) {
          //console.log('TaskDateCheck.addTask<-(' + id + ',' + from + ',' + to + ',' + planWork + ',' + actualWork + ')');
          logPrint('TaskDateCheck.addTask<-', id, from, to, planWork, actualWork);
          taskList.push({
            'id': id,
            'from': from,
            'to': to,
            'planWork': planWork,
            'actualWork': actualWork
          });
        },
        chgTask: function(id, from, to) {
          var task;

          logPrint('TaskDateCheck.chgTask<-', id, from, to);
          // 対象タスク検索
          for (var i = 0; i < taskList.length; i++) {
            if (id === taskList[i].id) {
              task = taskList[i];
              break;
            }
          }

          // 対象タスクが見つからない
          if (task === undefined) {
            logPrint('TaskDateCheck.chgTask->', 'undefined');
            return;
          }

          logPrint('TaskDateCheck.chgTask->', id, from, to);
          task.from = from;
          task.to = to;
        },
        delTask: function (id) {
          logPrint('TaskDateCheck.delTask<-', id);
          // 対象タスク検索
          for (var i = 0; i < taskList.length; i++) {
            if (id === taskList[i].id) {
              logPrint('deleet->', id);
              taskList.splice(i, 1);
              logPrint('TaskDateCheck.delTask->', 'deleted');
              break;
            }
          }
        },
        getFromToById: function (id) {
          logPrint('TaskDateCheck.getFromToById<-', id);
          // 対象タスク検索
          for (var i = 0; i < taskList.length; i++) {
            if (id === taskList[i].id) {
              logPrint('TaskDateCheck.getFromToById->', taskList[i].from, taskList[i].to);
              return {
                'from': taskList[i].from.clone(),
                'to': taskList[i].to.clone()
              };
            }
          }
          logPrint('TaskDateCheck.getFromToById->', 'undefined');
          return undefined;
        },
        dumpTask: function () {
          angular.forEach(taskList, function (task, i) {
            console.log('TaskDateCheck-' + i + ':(id=' + task.id + ',from=' + task.from.format('HH:mm') + ',to=' + task.to.format('HH:mm') + ')');
          });
        }
      };
    }])
;
