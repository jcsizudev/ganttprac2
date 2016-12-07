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
      '$modal', '$popover', 'TaskDateCheck', '$alert', 'TaskRowManager',
      'TaskManager', function(
        $scope, $timeout, $log, utils, ObjectModel, Sample,
        mouseOffset, debounce, moment,
        $modal, $popover, TaskDateCheck, $alert, TaskRowManager,
        TaskManager
      ) {
        var objectModel;
        var targetDay = moment(new Date(2016, 11, 15, 11, 20, 0));  // 対象日
        var targetFrom = moment(new Date(2016, 11, 15, 8, 0, 0));   // 対象日開始
        var targetTo = moment(new Date(2016, 11, 16, 12, 0, 0)); // 対象日終了
        var ganttScale = 15;  // '10 minutes'/'15 minutes'のみ
        var ganttMagnet = 15;

        var getGanttScale = function () {
          return ganttScale + ' ' + (ganttScale > 1 ? 'minutes' : 'minute');
        };

        var getGanttMagnet = function () {
          return ganttMagnet + ' ' + (ganttMagnet > 1 ? 'minutes' : 'minute');
        };

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
        $scope.targetUser = undefined;  // 作業者
        $scope.targetUserName = undefined;  // 作業者名称

        var drawOK = function () {
          return $scope.targetUser !== undefined;
        };

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
          if (minuteList.length === 0) {
            // マスタ設定による
            var l = 60 / ganttMagnet;
            for (var i = 0; i < l; i++) {
              minuteList.push({id: (ganttMagnet * i) + '', name: (ganttMagnet * i) + ''});
            }
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
        var clearTask = function () {
          angular.forEach($scope.data, function (row) {
            row.tasks = [];
            row.workmin = undefined;
          });
        };

        var loadTask = function (taskList, cnt) {
          if (cnt > 5) {
            console.log('retry over!');
          }
          else if (TaskDateCheck.countTask() === 0) {
            console.log('load=' + cnt);
            angular.forEach($scope.data, function (row) {
              angular.forEach(taskList, function (task) {
                if (task.rowId === row.id) {
                  // タスクを対象行に追加
                  row.tasks.push(angular.copy(task.task));
                }
              });
            });
          }
          else {
            console.log('retry=' + cnt);
            $timeout(function () {
              loadTask(taskList, (cnt + 1));
            }, 200);
          }
        };

        var ReloadTasks = function () {
          var taskList = TaskManager.getTask($scope.targetUser);
          clearTask();
          loadTask(taskList, 0);
        };

        var deleteTask = function (row, task) {
          // 重なりチェックデータからタスクを削除
          TaskDateCheck.delTask(task.id);
          for (var i = 0; i < row.model.tasks.length; i++) {
            if (row.model.tasks[i].id === task.id) {
              var workMin = task.workmin;
              // タスク時間を削除
              if (workMin !== undefined) {
                setWorkMinutes(row, workMin, 0);
              }
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
            $scope.options.maxHeight = true;
            $scope.collapseAll(); // 全ノードを一旦畳む
            $scope.api.tree.expand('3');  // 先頭ノードのみ開く※パラメータによる
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
            console.log('-描画中でない');
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
              if (planWork === false && actualWork === false) {
                setWorkMinutes(task.row, 0, fromTo.to.diff(fromTo.from, 'm'));
              }
              resizeTask(task.model, fromTo.from, fromTo.to);
              $scope.$applyAsync();
            }
          }
          else {
            console.log('-描画中');
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

        var taskRemove = function (eventName, task) {
          $log.info('[Event] ' + eventName + ': ' + task.model.name);
          console.log(task.model.id);
          TaskDateCheck.delTask(task.model.id);
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
            scale: getGanttScale(),
            sortMode: undefined,
            sideMode: 'TreeTable',
            daily: false,
            maxHeight: false,
            width: true,
            shortHeaders: ['day','hour'],
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
            fromDate: targetFrom,
            toDate: targetTo,
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
            columnMagnet: getGanttMagnet(),
            dependencies: false,
            targetDataAddRowIndex: 4,
            toolTipFormat: 'HH:mm',
            canDraw: function(event) {
                var isLeftMouseButton = event.button === 0 || event.button === 1;
                return drawOK() && $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
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
                    //api.tasks.on.remove($scope, addEventName('tasks.on.remove', logTaskEvent));
                    api.tasks.on.remove($scope, addEventName('tasks.on.remove', taskRemove));

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

        $scope.headersScales = {
          day: 'day',
          hour: 'hour'
        };
        $scope.headersFormats = {
          day: 'YYYY年MM月DD日',
          hour: function (column) {
            var lastHH = targetTo.day() === targetDay.day() ? targetTo.hour() : targetTo.hour() + 24;
            if (targetDay.day() === column.date.day()) {
              return column.date.format('HH:mm');
            }
            var hh = column.date.hour() + 24;
            var mm = column.date.minute();
            return (hh === lastHH && targetTo.minute() === 0) ? hh + '' : ('0' + hh).slice(-2) + ':' + ('0' + mm).slice(-2);
          }
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

            return 30 * zoom;
        };

        // Reload data action
        $scope.load = function() {
            console.log('***Load');
            //$scope.data = Sample.getSampleData();
            $scope.data = TaskRowManager.getRowData();

            $scope.rowcheck = [];

            //$scope.timespans = Sample.getSampleTimespans();
        };

        $scope.reload = function() {
            console.log('***Reload');
            $scope.load();
        };

        // Remove data action
        /*
        $scope.remove = function() {
            $scope.api.data.remove(dataToRemove);
            $scope.api.dependencies.refresh();
        };
        */

        // Clear data action
        $scope.clear = function() {
            $scope.data = [];
        };

        // パターンモーダルダイアログ
        // データ※ダミー
        var getPatternData = function () {
          return [
            {
              'title': '標準',
              'content': '標準パターン',
              'lastAccess': '2016/11/02'
            },
            {
              'title': '月曜',
              'content': '月曜日パターン',
              'lastAccess': undefined
            },
            {
              'title': '火曜',
              'content': '火曜日パターン',
              'lastAccess': undefined
            },
            {
              'title': '水曜',
              'content': '水曜日パターン',
              'lastAccess': '2016/11/05'
            },
            {
              'title': '木曜',
              'content': '木曜日パターン',
              'lastAccess': '2016/11/22'
            },
            {
              'title': '金曜',
              'content': '金曜日パターン',
              'lastAccess': undefined
            },
            {
              'title': '土曜',
              'content': '土曜日パターン',
              'lastAccess': undefined
            },
            {
              'title': '日曜',
              'content': '日曜日パターン',
              'lastAccess': undefined
            }
          ];
        };

        $scope.patternModal = {
          tabs: getPatternData(),
          instance: undefined,
          activePattern: undefined,
          activeLastAccess: undefined,
          isActive: function (title) {
            return $scope.patternModal.activePattern === title ? true : false;
          },
          setActive: function (title, lastAccess) {
            $scope.patternModal.activePattern = title;
            $scope.patternModal.activeLastAccess = lastAccess;
          }
        };
        $scope.patternModal.instance = $modal({
          animation: 'am-fade-and-slide-top',
          title: '基本パターン登録',
          templateUrl: 'template/P002_pattern.html',
          show: false
        });
        $scope.patternModal.instance.$promise.then(function () {
          $scope.patternModal.instance.$scope.patternModal = $scope.patternModal;
        });

        // 作業者選択モーダルダイアログ
        // データ※ダミー
        var getUserData = function () {
          return [
            {
              userCd: '000001',
              userName: '○山×夫',
              userClass: 'パート'
            },
            {
              userCd: '000002',
              userName: '○山×子',
              userClass: 'パート'
            },
            {
              userCd: '000003',
              userName: '○谷×彦',
              userClass: 'パート'
            },
            {
              userCd: '000004',
              userName: '○丘×子',
              userClass: '契約'
            },
            {
              userCd: '000005',
              userName: '○下×太',
              userClass: 'パート'
            },
            {
              userCd: '000006',
              userName: '○田×朗',
              userClass: 'パート'
            },
            {
              userCd: '000007',
              userName: '○島×美',
              userClass: '契約'
            },
            {
              userCd: '000008',
              userName: '○川×夫',
              userClass: 'パート'
            },
            {
              userCd: '000009',
              userName: '○山×佑',
              userClass: '契約'
            },
            {
              userCd: '000010',
              userName: '○崎×子',
              userClass: 'パート'
            },
            {
              userCd: '000011',
              userName: '○水×冶',
              userClass: 'パート'
            },
            {
              userCd: '000012',
              userName: '○木×美',
              userClass: '契約'
            },
            {
              userCd: '000013',
              userName: '○条×男',
              userClass: '契約'
            },
            {
              userCd: '000014',
              userName: '○平×也',
              userClass: 'パート'
            },
            {
              userCd: '000015',
              userName: '○郷×子',
              userClass: 'パート'
            },
          ];
        };

        var getDetailGroup = function () {
          return [
            {id: '1', name: 'ＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷＷ'},
            {id: '2', name: '詳細２'},
            {id: '3', name: '詳細３'},
            {id: '4', name: 'ＫＣカートＧその他'}
          ];
        };

        var getL1Group = function () {
          return [
            {id: '1', name: '大分類１'},
            {id: '2', name: '大分類２'},
            {id: '3', name: '大分類３'},
            {id: '4', name: '大分類４'}
          ];
        };

        var getABCGroup = function () {
          return [
            {id: '1', name: 'ABC１'},
            {id: '2', name: 'ABC２'},
            {id: '3', name: 'ABC３'},
            {id: '4', name: 'ABC４'}
          ];
        };

        $scope.workerModal = {
          instance: undefined,
          data: [],//getUserData(),
          groupType: 1,
          group: undefined,
          groups: [],
          totalItems: 5,
          currentPage: 1,
          currentArea: 1,
          currentPageArray: [],
          currentPageDataArray: [],
          pagesize: 5,
          areaSize: 3,
          selectedUser: undefined,
          selectedUserName: undefined,
          totalPage: function () {
            var self = $scope.workerModal;
            var total = Math.floor(self.totalItems / self.pagesize);
            return (self.totalItems % self.pagesize) === 0 ? total : total + 1;
          },
          totalArea: function () {
            var self = $scope.workerModal;
            var total = Math.floor(self.totalPage() / self.areaSize);
            return (self.totalPage() % self.areaSize) === 0 ? total : total + 1;
          },
          isFirstPage: function () {
            var self = $scope.workerModal;
            return (self.currentPage === 1);
          },
          isLastPage: function () {
            var self = $scope.workerModal;
            return (self.currentPage === self.totalPage());
          },
          isFirstArea: function () {
            var self = $scope.workerModal;
            return (self.currentArea === 1);
          },
          isLastArea: function () {
            var self = $scope.workerModal;
            return (self.currentArea === self.totalArea());
          },
          getCurrentPageArray: function () {
            var self = $scope.workerModal;
            var arr = [];
            var totalPage = self.totalPage();
            var elem;
            for (var i = 0; i < self.areaSize; i++) {
              elem = ((self.currentArea - 1) * self.areaSize) + (i + 1);
              if (elem <= totalPage) {
                arr.push(elem);
              }
            }
            return arr;
          },

          getCurrentPageDataArray: function () {
            var self = $scope.workerModal;
            var arr = [];
            var pos = (self.currentPage - 1) * self.pagesize;
            for (var i = pos; i < (pos + self.pagesize); i++) {
              if (i < self.data.length) {
                arr.push(self.data[i]);
              }
            }
            return arr;
          },

          isCurrentPage: function (page) {
            var self = $scope.workerModal;
            console.log('pageNo=' + page);
            return (page === self.currentPage);
          },
          prevArea: function () {
            var self = $scope.workerModal;
            if (!self.isFirstArea()) {
              self.currentArea -= 1;
              self.currentPageArray = self.getCurrentPageArray();
              self.currentPage = self.currentPageArray[self.currentPageArray.length - 1];
              self.currentPageDataArray = self.getCurrentPageDataArray();
              self.selectedUser = undefined;
            }
          },
          nextArea: function () {
            var self = $scope.workerModal;
            if (!self.isLastArea()) {
              self.currentArea += 1;
              self.currentPageArray = self.getCurrentPageArray();
              self.currentPage = self.currentPageArray[0];
              self.currentPageDataArray = self.getCurrentPageDataArray();
              self.selectedUser = undefined;
            }
          },
          prevPage: function () {
            var self = $scope.workerModal;
            if (self.currentPage > 1 ) {
              if (self.currentPageArray.includes(self.currentPage - 1)) {
                self.currentPage -= 1;
                self.currentPageDataArray = self.getCurrentPageDataArray();
                self.selectedUser = undefined;
              }
              else {
                self.prevArea();
              }
            }
          },
          nextPage: function () {
            var self = $scope.workerModal;
            if (self.currentPage < self.totalPage() ) {
              if (self.currentPageArray.includes(self.currentPage + 1)) {
                self.currentPage += 1;
                self.currentPageDataArray = self.getCurrentPageDataArray();
                self.selectedUser = undefined;
              }
              else {
                self.nextArea();
              }
            }
          },
          setPage: function (page) {
            var self = $scope.workerModal;
            console.log('pageNo=' + page);
            self.currentPage = page;
            self.currentPageDataArray = self.getCurrentPageDataArray();
            self.selectedUser = undefined;
          },
          chgGroupType: function () {
            var self = $scope.workerModal;
            var gType = self.groupType + '';
            if (gType === '1') {
              self.groups = getDetailGroup();
            }
            else if (gType === '2') {
              self.groups = getL1Group();
            }
            else {
              self.groups = getABCGroup();
            }
          },
          searchUser: function () {
            var self = $scope.workerModal;
            self.selectedUser = undefined;
            self.data = getUserData();
            self.totalItems = self.data.length;
            self.currentPageArray = self.getCurrentPageArray();
            self.currentPageDataArray = self.getCurrentPageDataArray();
          },
          isSelectedUser: function (user) {
            var self = $scope.workerModal;
            if (self.selectedUser === user) {
              return true;
            }
            return false;
          },
          selectUser: function (user, userName) {
            console.log('Here!');
            var self = $scope.workerModal;
            self.selectedUser = user;
            self.selectedUserName = userName;
          },
          cancel: function () {
            var self = $scope.workerModal;
            self.selectedUser = undefined;
            self.data = [];
            self.totalItems = undefined;
            self.currentPageArray = [];
            self.currentPageDataArray = [];
            self.instance.hide();
          },
          select: function () {
            var self = $scope.workerModal;

            $scope.targetUser = self.selectedUser;  // 作業者
            $scope.targetUserName = self.selectedUser + '_' + self.selectedUserName;  // 作業者名称
            ReloadTasks();

            self.cancel();
          }
        };
        $scope.workerModal.groups = getDetailGroup();
        console.log('$scope.workerModal.totalArea()=' + $scope.workerModal.totalArea());
        console.log('$scope.workerModal.totalArea()=' + $scope.workerModal.totalPage());

        $scope.workerModal.instance = $modal({
          animation: 'am-fade-and-slide-top',
          title: '作業者選択',
          templateUrl: 'template/P002_worker.html',
          show: false
        });
        $scope.workerModal.instance.$promise.then(function () {
          $scope.workerModal.instance.$scope.workerModal = $scope.workerModal;
        });


    }]);
