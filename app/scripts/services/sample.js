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
                              workmin: 30,
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
