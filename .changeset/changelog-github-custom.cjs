'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
// @ts-ignore
var get_github_info_1 = require('@changesets/get-github-info');
var dotenv_1 = require('dotenv');
(0, dotenv_1.config)();
var changelogFunctions = {
  getDependencyReleaseLine: function (changesets, dependenciesUpdated, options) {
    return __awaiter(void 0, void 0, void 0, function () {
      var changesetLink, _a, updatedDepenenciesList;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (!options.repo) {
              throw new Error(
                'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
              );
            }
            if (dependenciesUpdated.length === 0) return [2 /*return*/, ''];
            _a = '- Updated dependencies ['.concat;
            return [
              4 /*yield*/,
              Promise.all(
                changesets.map(function (cs) {
                  return __awaiter(void 0, void 0, void 0, function () {
                    var links;
                    return __generator(this, function (_a) {
                      switch (_a.label) {
                        case 0:
                          if (!cs.commit) return [3 /*break*/, 2];
                          return [
                            4 /*yield*/,
                            (0, get_github_info_1.getInfo)({
                              repo: options.repo,
                              commit: cs.commit,
                            }),
                          ];
                        case 1:
                          links = _a.sent().links;
                          return [2 /*return*/, links.commit];
                        case 2:
                          return [2 /*return*/];
                      }
                    });
                  });
                }),
              ),
            ];
          case 1:
            changesetLink = _a.apply('- Updated dependencies [', [
              _b
                .sent()
                .filter(function (_) {
                  return _;
                })
                .join(', '),
              ']:',
            ]);
            updatedDepenenciesList = dependenciesUpdated.map(function (dependency) {
              return '  - '.concat(dependency.name, '@').concat(dependency.newVersion);
            });
            return [
              2 /*return*/,
              __spreadArray([changesetLink], updatedDepenenciesList, true).join('\n'),
            ];
        }
      });
    });
  },
  getReleaseLine: function (changeset, type, options) {
    return __awaiter(void 0, void 0, void 0, function () {
      var prFromSummary,
        commitFromSummary,
        usersFromSummary,
        replacedChangelog,
        linkifyIssueHints,
        _a,
        firstLine,
        futureLines,
        links,
        users,
        suffix,
        emojiFirstline;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (!options || !options.repo) {
              throw new Error(
                'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
              );
            }
            usersFromSummary = [];
            replacedChangelog = changeset.summary
              .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, function (_, pr) {
                var num = Number(pr);
                if (!isNaN(num)) prFromSummary = num;
                return '';
              })
              .replace(/^\s*commit:\s*([^\s]+)/im, function (_, commit) {
                commitFromSummary = commit;
                return '';
              })
              .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, function (_, user) {
                usersFromSummary.push(user);
                return '';
              })
              .trim();
            linkifyIssueHints = function (line) {
              return line.replace(
                /(?<=\( ?(?:fix|fixes|see) )(#\d+)(?= ?\))/g,
                function (issueHash) {
                  return '['
                    .concat(issueHash, '](https://github.com/')
                    .concat(options.repo, '/issues/')
                    .concat(issueHash.substring(1), ')');
                },
              );
            };
            (_a = replacedChangelog.split('\n').map(function (l) {
              return linkifyIssueHints(l.trimEnd());
            })),
              (firstLine = _a[0]),
              (futureLines = _a.slice(1));
            return [
              4 /*yield*/,
              (function () {
                return __awaiter(void 0, void 0, void 0, function () {
                  var links_1, shortCommitId, commitToFetchFrom, links_2;
                  return __generator(this, function (_a) {
                    switch (_a.label) {
                      case 0:
                        if (!(prFromSummary !== undefined)) return [3 /*break*/, 2];
                        return [
                          4 /*yield*/,
                          (0, get_github_info_1.getInfoFromPullRequest)({
                            repo: options.repo,
                            pull: prFromSummary,
                          }),
                        ];
                      case 1:
                        links_1 = _a.sent().links;
                        if (commitFromSummary) {
                          shortCommitId = commitFromSummary.slice(0, 7);
                          links_1 = __assign(__assign({}, links_1), {
                            commit: '[`'
                              .concat(shortCommitId, '`](https://github.com/')
                              .concat(options.repo, '/commit/')
                              .concat(commitFromSummary, ')'),
                          });
                        }
                        return [2 /*return*/, links_1];
                      case 2:
                        commitToFetchFrom = commitFromSummary || changeset.commit;
                        if (!commitToFetchFrom) return [3 /*break*/, 4];
                        return [
                          4 /*yield*/,
                          (0, get_github_info_1.getInfo)({
                            repo: options.repo,
                            commit: commitToFetchFrom,
                          }),
                        ];
                      case 3:
                        links_2 = _a.sent().links;
                        return [2 /*return*/, links_2];
                      case 4:
                        return [
                          2 /*return*/,
                          {
                            commit: null,
                            pull: null,
                            user: null,
                          },
                        ];
                    }
                  });
                });
              })(),
            ];
          case 1:
            links = _b.sent();
            users = usersFromSummary.length
              ? usersFromSummary
                  .map(function (userFromSummary) {
                    return '[@'
                      .concat(userFromSummary, '](https://github.com/')
                      .concat(userFromSummary, ')');
                  })
                  .join(', ')
              : links.user;
            suffix = '';
            if (links.pull || links.commit || users) {
              suffix = '('
                .concat(users ? 'by '.concat(users, ' ') : '', 'in ')
                .concat(links.pull || links.commit, ')');
            }
            emojiFirstline = firstLine
              .replace('FEAT:', '✨ ')
              .replace('feat:', '✨ ')
              .replace('fix:', '🐞🩹')
              .replace('FIX:', '🐞🩹')
              .replace('DOCS:', '📃')
              .replace('docs:', '📃');
            return [
              2 /*return*/,
              '\n\n- '
                .concat(emojiFirstline, ' ')
                .concat(suffix, '\n')
                .concat(
                  futureLines
                    .map(function (l) {
                      return '  '.concat(l);
                    })
                    .join('\n'),
                ),
            ];
        }
      });
    });
  },
};
exports.default = changelogFunctions;
