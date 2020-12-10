/**
 * Created by Shen.L on 2016/1/28.
 */
(function ($) {
  $(function () {
    //$(document).off('click.bs.tab.data-api', '[data-hover="tab"]');
    $(document).on('mouseenter.bs.tab.data-api', '[data-hover="tab"]', function () {
      $(this).tab('show');
    });
  });
})(jQuery);

var SinTheme = function () {

  var chapter = {
    images: [],
    path: '',
    imageList: null,
    currentIndex: -1,
    preloadIndex: 1,
    busy: true
  };

  function getPage() {
    if (chapter.currentIndex > -1) return chapter.currentIndex;
    var query = SinConf.desktop.chapter.reload == true ? window.location.search.substr(1) : window.location.hash.substr(1);
    var temp = query.split('&');
    var i = 0;
    while (temp[i]) {
      temp[i] = temp[i].split('=');
      if (temp[i][0] == 'p') {
        return parseInt(temp[i][1]);
      }
      i++;
    }
    return 1;
  }

  function getPreloadIndex() {
    chapter.preloadIndex = chapter.preloadIndex > chapter.currentIndex ? chapter.preloadIndex : chapter.currentIndex;
    return chapter.preloadIndex;
  }

  function getChapterScroll() {
    var chapterScroll = store.get('chapterScroll');
    if (chapterScroll) return chapterScroll === 'scroll';
    return SinConf.desktop.chapter.mode === 'scroll';
  }

  function setChapterScroll(mod) {
    store.set('chapterScroll', mod ? 'scroll' : 'pagination');
    window.location.reload();
  }

  function getChapterAutoSize() {
    var chapterAutoSize = store.get('chapterAutoSize');
    if (chapterAutoSize) return chapterAutoSize === 'autoSize';
    return SinConf.desktop.chapter.imageWidth === 'auto';
  }

  function setChapterAutoSize(autoSize) {
    store.set('chapterAutoSize', autoSize ? 'autoSize' : 'original');
    window.location.reload();
  }

  /**
   * 获取当前图片页码
   * @returns {*}
   */
  function getImageIndex() {
    var images_height = chapter.imageList.offset().top;
    var c = document.documentElement.clientHeight || document.body.clientHeight, t = $document.scrollTop();
    var scroll_height = t + c;
    var images = chapter.imageList.find('img');
    var imageIndex = images.length;
    images.each(function (i) {
      images_height += $(this).height();
      if (images_height > scroll_height) {
        imageIndex = $(this).data('index') || 1;
        return false;
      }
    });
    return chapter.currentIndex = imageIndex;
  }


  function handleScrollTop() {
    var offset = 300;
    var duration = 500;
    var fn = function (e) {
      if ($window.scrollTop() > offset) {
        $('.scroll-top').fadeIn(duration);
      } else {
        $('.scroll-top').fadeOut(duration);
      }
    };
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {  // ios supported
      $window.bind("touchend touchcancel touchleave", fn);
    } else {  // general
      console.log('general');
      $window.scroll(fn);
    }
  }

  function handleSearch() {
    // 绑定搜索按钮绑定事件和关键字变化时间
    var keywords = $('#keywords'), keywordsValue, timeout = 0, suggest = -1, resultCount = 0, resultItems,
      searchResult = $('#search-results'),
      renderResult = function (data, selector, template) {
        // var render = baidu.template('search-template');
        // searchResult.html(render(data));
        searchResult.fadeIn();
        resultItems = searchResult.find('li');
        resultItems.mouseover(function () {
          suggest = resultItems.index(this);
          selectSuggest();
        });
        resultCount = data.items.length;
      },
      submitSearch = function () {
        if (suggest > -1) {
          window.location.href = searchResult.find("li").eq(suggest).data("url");
        } else {
          keywordsValue = keywords.val();
          if (keywordsValue === '' || keywordsValue === undefined || keywordsValue === null) {
            keywords.focus();
            return alert('请输入关键字');
          }
          window.location.href = '/search/?keywords=' + keywords.val();
        }
      },
      ajaxSearch = function (e) {
        timeout && clearTimeout(timeout);
        timeout = setTimeout(function () {
          keywordsValue = keywords.val();
          if (keywordsValue === '') {
            searchResult.fadeOut();
            return;
          }
          SinMH.search(keywordsValue, function (res) {
            renderResult(res);
          });
        }, 500);
      },
      selectSuggest = function () {
        if (suggest = suggest < -1 ? resultCount - 1 : suggest >= resultCount ? -1 : suggest, suggest == -1) keywords.val(keywordsValue);
        else {
          var selected = resultItems.removeClass("selected").eq(suggest);
          selected.addClass("selected");
          keywords.val(selected.attr("title"));
        }
        console.log(suggest, resultCount);
      };
    $('#btnSearch').click(submitSearch);
    $window.click(function () {
      searchResult.fadeOut();
    });
    keywords.focus(ajaxSearch).blur(function (e) {
      setTimeout(function () {
        searchResult.fadeOut();
      }, 300);
    }).keyup(function (e) {
      if (e.stopPropagation(), e.keyCode == 13) submitSearch();
      else {
        if (searchResult[0].style.display != "none") switch (e.keyCode) {
          case 13:
            submitSearch();
            break;
          case 27:
            console.log('esc');
            suggest != -1 ? (suggest = -1, selectSuggest()) : searchResult.fadeOut();
            break;
          case 38:
            suggest--;
            selectSuggest();
            break;
          case 40:
            suggest++;
            selectSuggest();
            break;
          default:
            ajaxSearch();
        } else switch (e.keyCode) {
          case 27:
            break;
          case 38:
          case 40:
            resultCount > 0 && searchResult.fadeIn();
            break;
          default:
            ajaxSearch();
        }
      }
    });
  }

  function chapterSort() {
    $('.chapter-sort').click(function () {
      var order = $(this).data('order');
      var key = $(this).parent().data('key');
      var obj = $('#chapter-list-' + key);
      var sort = obj.data('sort') || 'asc';
      order = order || 'asc';
      if (sort == order) return;
      var chapters = obj.children('li');
      chapters = $.makeArray(chapters);
      chapters.reverse();
      obj.html(chapters);
      obj.data('sort', order);
      $(this).addClass('active').siblings().removeClass('active');
    });
  }

  function chapterCollapse() {
    $('.action-collapse').click(function (e) {
      console.log('章节折叠');
      var collapse = $(this).data('collapse');
      var key = $(this).parent().data('key');
      var obj = $('#chapter-list-' + key);
      console.log(collapse, key, obj);

      if (collapse == 1) {
        obj.removeClass('chapter-collapse');
        $(this).data('collapse', 0);
        $(this).text('折叠→');
      } else {
        obj.addClass('chapter-collapse');
        $(this).data('collapse', 1);
        $(this).text('展开↓');
      }
    });
  }

  function comicSubscribe(comic_id) {
    var updateSubscribe = function () {
      var subscribe = store.getSubscribe(comic_id);
      if (subscribe != null) {
        var readTo = subscribe.read_chapter == null ? '尚未阅读' : '<a href="' + subscribe.read_chapter_url + '">' + subscribe.read_chapter + '</a>';
        $("#div-subscribe").hide();
        $("#div-subscribed").show();
        $("#read-to").html(readTo);
      } else {
        $("#div-subscribed").hide();
        $("#div-subscribe").show();
      }
    };
    $('#subscribe').click(function () {
      SinMH.subscribe(comic_id, function (res) {
        if (res.status == 0) {
          confirmModal('订阅成功，是否接收邮件提醒', function (res) {
            SinMH.subscribeNotify(comic_id, function (res) {
              if (res.status == 501) {
                alertModal('接收邮件提醒请先验证邮箱, 点击<a href="/member/" target="_blank">立即验证</a>'/*,function (e) {
                                  window.location.href = '/member/';
                              }*/);
              }
            })
          });
          updateSubscribe();
        } else alertModal(res.data);
      });
    });
    $('#remove-subscribe').click(function () {
      SinMH.subscribe(comic_id, 'delete', function (res) {
        if (res.status == 0) {
          alertModal('取消订阅成功');
          updateSubscribe();
        } else alertModal(res.data);
      });
    });
    updateSubscribe();
  }


  function comicOpinion(comic_id) {
    $('.vote .item').click(function () {
      var that = $(this);
      var option = that.data('option');
      SinMH.comicOpinion(comic_id, option, function (res) {
        if (res.status == 0) {
          var optionCount = that.find('p').first();
          optionCount.text(parseInt(optionCount.text()) + 1);
          alertModal('投票成功');
        } else {
          alertModal(res.data);
        }
      })
    });
  }

  function comicScore(comic_id) {
    var rating = $('.pf_star a'),
      setScore = function (score) {
        rating.attr('class', '').css('cursor', 'default').off('click');
        $('#currentData').css('width', score * 20 + 'px');
      };
    rating.click(function () {
      var star = $(this).data('stars');
      SinMH.comicScore(comic_id, star, function (res) {
        if (res.status == 0) {
          var scoreCount = $('#scoreCount');
          scoreCount.text(parseInt(scoreCount.text()) + 1);
          alertModal('评分成功');
          setScore(star);
        } else {
          alertModal(res.data);
        }
      });
    });
    if ($.cookie('score-' + comic_id) != undefined) {
      setScore($.cookie('score-' + comic_id));
    }
  }

  function comicDescription() {
    $("#des-extend").click(function () {
      $("#des-simple").hide();
      $("#des-full").show();
    });
    $("#des-hide").click(function () {
      $("#des-simple").show();
      $("#des-full").hide();
    });

  }

  function prevPage() {
    if (chapter.currentIndex <= 1) {
      return prevChapter();
      alert('已经是第一页');
      return true;
    }
    SinMH.scrollTo('#images');
    jumpPage(--chapter.currentIndex);
    /*showImage(--chapter.currentIndex);
     window.location.hash = 'p=' + chapter.currentIndex;
     return false;*/
  }

  function nextPage() {
    if (chapter.currentIndex >= SinMH.getChapterImageCount()) {
      return nextChapter();
      alert('已经是最后一页');
      return true;
    }
    SinMH.scrollTo('#images');
    jumpPage(++chapter.currentIndex);
    /*showImage(++chapter.currentIndex);
     chapter.currentIndex > chapter.historyIndex && (chapter.historyIndex = chapter.currentIndex) && SinMH.addHistory();
     window.location.hash = 'p=' + chapter.currentIndex;*/
  }

  function renderPageSelect(pageCount, current, selector) {
    // TODO 渲染翻页选择组件
    var select_str = '';
    for (var i = 1; i <= pageCount; i++) {
      if (current == i) {
        select_str += '<option value=' + i + ' selected="selected">第' + i + '页</option>';
      } else {
        select_str += '<option value=' + i + '>第' + i + '页</option>';
      }
    }
    $(selector).html(select_str);
  }

  function jumpPage(page) {
    chapter.currentIndex = page;
    if (SinConf.desktop.chapter.reload == true) {
      return window.location.replace(window.location.pathname + '?p=' + chapter.currentIndex);
    }
    showImage(chapter.currentIndex);
    chapter.currentIndex > chapter.historyIndex && (chapter.historyIndex = chapter.currentIndex) && SinMH.addHistory();
    window.location.hash = 'p=' + chapter.currentIndex;
  }

  function prevChapter() {
    if (prevChapterData.id && prevChapterData.id > 0) {
      window.location.href = comicUrl + prevChapterData.id + '.html';
      return;
    }
    alert('已经是第一章了');
  }

  function nextChapter() {
    if (nextChapterData.id && nextChapterData.id > 0) {
      window.location.href = comicUrl + nextChapterData.id + '.html';
      return;
    }
    alert('已经是最后一章了');
  }

  /**
   * 预加载图片
   */
  function preloadImage() {
    // 若是滚动则直接显示并继续加载，否则加载仅加载图片
    var page = getPreloadIndex() + 1;
    if (page > SinMH.getChapterImageCount() || page - chapter.currentIndex > SinConf.desktop.chapter.maxPreload) return;
    chapter.preloadIndex++;
    if (getChapterScroll()) {
      showImage(page);
    } else {
      $.preLoadImg(SinMH.getChapterImage(page));
    }
  }

  function showImage(page) {
    //根据page获取图片地址
    if (page === undefined && getChapterScroll()) {
      chapter.scrollStart = getPage();
    }
    page = page || getPage();
    var imgUrl = SinMH.getChapterImage(page);
    var imgStr = '<img src="' + imgUrl + '" data-index="' + page + '"/>';
    var imgInfo = '<p class="img_info">(' + page + '/' + SinMH.getChapterImageCount() + ')</p>';
    var loading = $('#imgLoading');
    loading.show();
    if (getChapterScroll()) {
      chapter.imageList.append(imgStr);
    } else {
      $("#page").text(page);
      chapter.imageList.html(imgStr);
    }
    var lastObj = chapter.imageList.find('img').last();
    lastObj.hide();
    var showAndPreload = function () {
      lastObj.show();
      loading.hide();
      if (chapter.scrollStart > 1) {
        chapter.imageList.prepend('<p><a href="javascript:SinMH.chapterReload()" >查看完整章节</a></p>');
        chapter.scrollStart = 0;
      }
      SinMH.getChapterImageCount() > 0 && chapter.imageList.append(imgInfo);
      renderPageSelect(SinMH.getChapterImageCount(), chapter.currentIndex, '#page_select');
      preloadImage();
    };
    if (getChapterAutoSize()) {
      lastObj.imgAutoSize(chapter.imageList.width(), 0, function () {
        showAndPreload();
      });
    } else {
      $.preLoadImg(imgUrl, function () {
        showAndPreload();
      });
    }

  }

  function chapterScroll() {
    if (!getChapterScroll()) {
      $('#mode_pagination').attr('checked', 'checked');
      return;
    }
    $('#mode_scroll').attr('checked', 'checked');
    $('#page_select').hide();
    $('.img_land_prev').hide();
    $('.img_land_next').hide();
    var sTimer = null;
    $window.scroll(function chapterScrollHandler() {
      getImageIndex() > chapter.historyIndex && (chapter.historyIndex = chapter.currentIndex) && SinMH.addHistory();
      clearTimeout(sTimer);
      sTimer = setTimeout(function () {
        if (window.loaded == 1) {
          $window.unbind("scroll", chapterScrollHandler);
        }
        preloadImage();
        return;
        /*var c = document.documentElement.clientHeight || document.body.clientHeight, t = $document.scrollTop();
         if (t + c >= chapter.imageList.offset().top + chapter.imageList.height() - 600) {
         preloadImage();
         }*/
      },
        500
      );
    });
  }

  /**
   * 绑定章节详情热键
   */
  function chapterHotKeys() {
    var hotKeys = SinMH.getHotKeys();
    if (!getChapterScroll()) {
      $document.bind('keyup', hotKeys.prev, prevPage);
      $document.bind('keyup', hotKeys.next, nextPage);
    }
    $document.bind('keyup', hotKeys.prevChapter, prevChapter);
    $document.bind('keyup', hotKeys.nextChapter, nextChapter);
    $document.bind('keyup', hotKeys.back, function () {
      window.location.href = comicUrl;
    });
    $(".prevPage").text(hotKeys.prev);
    $(".nextPage").text(hotKeys.next);
    $(".prevChapter").text(hotKeys.prevChapter);
    $(".nextChapter").text(hotKeys.nextChapter);
    $(".back").text(hotKeys.back);
  }

  function comicHotKeys() {
    var hotKeys = SinMH.getHotKeys();
    // TODO 绑定漫画详情页快捷键
    $document.bind('keyup', hotKeys.read, read);
  }

  function renderResServer(selector, template) {
    var data = { list: SinConf.resHost };
    // var render = baidu.template(template);
    // $(selector).html(render(data));
  }

  function renderBookshelf() {
    $("#bookshelf").hover(function () {
      $(this).addClass("over");
    }, function () {
      $(this).removeClass("over");
    });
    renderHistory('#history-list', 'history-template', "history");
    renderHistory('#subscribe-list', 'subscribe-template', "subscribe");
  }

  function renderHistory(selector, template, type, lenght) {
    type = type == "subscribe" ? "subscribe" : "history";
    var event = type == "subscribe" ? 'sinSubscribeUpdated' : 'sinHistoryUpdated';
    var data = { list: store.get(type) };
    lenght && data.list.length > lenght && data.list.splice(lenght, data.list.length - lenght);
    // var render = baidu.template(template);
    // $(selector).html(render(data));
    $window.one(event, function () {
      renderHistory(selector, template, type, lenght);
    });
  }

  function alertModal(msg, fn) {
    var $modal = $('#alert-modal');
    if (typeof msg === 'string') msg = { title: '提示信息', body: msg };
    if (msg === undefined || msg === null) msg = { title: '提示信息', body: '有错误发生' };
    $modal.find('.modal-title').text(msg.title);
    $modal.find('.modal-body').html(msg.body);
    $modal.modal('show');
    $modal.off('hidden.bs.modal').on('hidden.bs.modal', function () {
      typeof fn === 'function' && fn();
    });
  }

  function confirmModal(msg, fn) {
    var $modal = $('#confirm-modal');
    if (typeof msg === 'string') msg = { title: '提示信息', body: msg };
    if (msg === undefined || msg === null) msg = { title: '提示信息', body: '有错误发生' };
    $modal.find('.modal-title').text(msg.title);
    $modal.find('.modal-body').html(msg.body);
    $modal.modal('show');
    typeof fn !== 'function' && (fn = function () {
      //alert(22);
    });
    var btn = $modal.find('.btn-confirm');
    btn.click(fn);
    $modal.on('hidden.bs.modal', function () {
      btn.unbind();
    });
  }

  function toastModal(msg, fn) {
    var $modal = $('#toast-modal');
    if (typeof msg === 'string') msg = { title: '提示信息', body: msg };
    $modal.find('.modal-title').text(msg.title);
    $modal.find('.modal-body').text(msg.body);
    $modal.modal('show');
    typeof fn !== 'function' && (fn = function () {
      alert(22)
    });
    var btn = $modal.find('.btn-confirm');
    btn.click(fn);
    $modal.on('hidden.bs.modal', function () {
      btn.unbind();
    });
  }

  function switchStyle(style) {
    if (style !== undefined) {
      store.set('style', parseInt(style));
    } else {
      style = parseInt(store.get('style') || 0);
    }
    var styleCtrl = $("#skin");
    styleCtrl.find('li').removeClass('active').eq(style).addClass('active');
    var $body = $('body');
    for (var i = 0; i < 7; i++) {
      $body.removeClass('style-' + i);
    }
    $body.addClass('style-' + style);
  }

  // 动态搜索

  function initUser() {

    if (undefined !== SinMH.getToken()) {
      var identity = SinMH.getIdentity();
      $(".user-login").hide();
      $(".user-action").show();
      $("#username").html(identity['username']);
      $("#avatar").attr("src", identity['avatar']);

      //更新通知
      updateNotice();
      $window.on('sinSubscribeUpdated', function () {
        updateNotice();
      });
    } else {
      $(".user-login").show();
      $(".user-action").hide();
    }
  }

  function updateNotice() {
    var update_count = SinMH.countUnreadSubscribe();
    console.log(update_count);
    if (update_count > 0) {
      $("#update_notice").show();
      $("#update_count").html(update_count);
    } else {
      $("#update_notice").hide();
    }
  }

  function initChapterEvent() {
    var dark = $('#close-d'), light = $('#open-d'), bg = store.get('read-bg-dark'), width = store.get('width'), resIndex = SinMH.getResHostIndex(), scroll = getChapterScroll();
    $('#read-set')
      .hover(function (e) { $(this).html('<span>阅读设置</span>'); }, function (e) { $(this).html(''); })
      .click(function (e) {
        var $this = $(this), open = $this.data('open');
        if (open) {
          $('#sideBarOpen').hide();
          $this.data('open', false);
        } else {
          $('#sideBarOpen').show();
          $this.data('open', true);
        }
      });
    dark.hover(function (e) { $(this).html('<span>关灯阅读</span>'); }, function (e) { $(this).html(''); })
      .click(function (e) {
        dark.parent().hide();
        light.parent().show();
        $('body').removeClass('last_bg').addClass('close_bg');
        store.set('read-bg-dark', 1);
      });
    light.hover(function (e) { $(this).html('<span>开灯阅读</span>'); }, function (e) { $(this).html(''); })
      .click(function (e) {
        light.parent().hide();
        dark.parent().show();
        $('body').removeClass('close_bg').addClass('last_bg');
        store.set('read-bg-dark', 0);
      });
    if (bg == 1) {
      dark.parent().hide();
      light.parent().show();
      $('body').removeClass('last_bg').addClass('close_bg');
    } else {
      light.parent().hide();
      dark.parent().show();
      $('body').removeClass('close_bg').addClass('last_bg');
    }
    if (width == 1) {
      $('#sizeT').attr('checked', 'checked');
      $('body').addClass('img_width_100');
    } else {
      $('#sizeF').attr('checked', 'checked');
      $('body').removeClass('img_width_100');
    }
    $('#set-cancel').click(function () { $('#read-set').data('open', false); $('#sideBarOpen').hide(); });
    $('#set-ok').click(function (e) {
      var imgType = $('input[name="size"]:checked').val(),
        mode = $('input[name="mode"]:checked').val(),
        res = $('input[name="res"]:checked').val(),
        reload = (mode != scroll) || (res != resIndex);
      console.log(imgType, mode, res);
      if (imgType == 1) {
        console.log('add');
        $('body').addClass('img_width_100');
      } else {
        console.log('remove');
        $('body').removeClass('img_width_100');
      }
      store.set('width', imgType);
      store.set('resHostIndex', res);
      store.set('chapterScroll', mode == 1 ? 'scroll' : 'pagination');
      if (reload) window.location.reload();
      $('#read-set').data('open', false); $('#sideBarOpen').hide();
    });
  }
  function initBackground() {
    if (typeof chapterImages !== 'undefined') return;
    if (undefined === SinConf.theme || undefined === SinConf.theme.dmzj || undefined === SinConf.theme.dmzj.background) return false;
    var bgSetting = SinConf.theme.dmzj.background,
      index = 0,
      mode = bgSetting.mode === 'rand' ? 'rand' : 'turn',
      images = bgSetting.images || [],
      path = typeof bgSetting.path !== 'string' || bgSetting.path == '' ? 'themes/dmzj/desktop/background' : bgSetting.path;
    if (typeof images !== 'object' || images.length < 1) return false;
    if (mode === 'rand') {
      index = Math.floor(Math.random() * images.length);
    } else {
      var last = store.get('dmzj-bg-index');
      if (last !== false) index = last >= images.length - 1 ? 0 : parseInt(last) + 1;
      store.set('dmzj-bg-index', index);
    }
    var url = trim(SinMH.getResHostDomain(), '/') + '/' + trim(path, '/') + '/' + trim(images[index], '/');
    $('body').css('background', '#fff url("' + url + '") no-repeat top center')
  }
  function initNotice() {
    var notice = $('#index-notice'), items = notice.find('li');
    if (items.length < 2) return false;
    notice.hover(function () {
      notice.addClass('hover');
    }, function () {
      notice.removeClass('hover');
    });
    var tick = function () {
      if (notice.hasClass('hover')) return;
      var item = notice.find('li').first().slideUp();
      setTimeout(function () {
        item.remove().show().appendTo(notice);
      }, 1000);
    };
    setInterval(tick, 5000);
  }

  /**
   * 初始化章节购买
   */
  function _initChapterBuy(id) {
    if (!SinMH.hasEdition(SinMH.edition.vip)) return;
    if (chapterCanRead || chapterPrice <= 0) return;
    // tip 自动购买功能由PHP程序完成，访问页面即自动判断并购买
    var modalBuy = $("#modal-buy"), busy = false;
    modalBuy.modal({ backdrop: 'static', keyboard: false });
    $('#buy-chapter').on('click', function () {
      if (busy) return alert('请勿重复提交');
      busy = true;
      var renew = $("#renew").prop("checked");
      SinMH.buyChapter(id, renew, function (res) {
        if (res.status !== 0) {
          return alertModal(res.data);
        }
        modalBuy.modal('hide');
        alertModal('购买成功', function (e) {
          window.location.reload();
        });
        //window.location.reload();
      });
    });
  }

  function _initComicBuy(id) {
    if (!SinMH.hasEdition(SinMH.edition.vip)) return;
    // 初始话漫画购买
    var chapterList = $('.zj_list'), newChapters = $('li.new'), selectAll = $('#select-all'),
      chapterFilter = $('#chapter-filter'),
      busy = false,
      statPrice = function (type) {
        if (type === 1 || type === 'active') type = 'active';
        else type = 'new';
        var count = 0, total = 0, vipTotal = 0;
        chapterList.find('li.' + type).each(function (index, item) {
          var $item = $(item);
          count++;
          total += parseInt($item.data('price'));
          vipTotal += parseInt($item.data('vip-price'));
        });
        if (type === 'active') {
          $('#amount').text(total);
          $('#count').text(count);
          $('#vip-amount').text(vipTotal);
        } else {
          // 全部购买计算价格
          $('#all-amount').text(total);
          $('#all-count').text(count);
          $('#all-vip-amount').text(vipTotal);
        }
      },
      buyChapters = function (type) {
        if (busy) return alert('请勿重复提交');
        busy = true;
        if (type === 1 || type === 'active') type = 'active';
        else type = 'new';
        var ids = [];
        chapterList.find('li.' + type).each(function (index, item) {
          var $item = $(item);
          ids.push(parseInt($item.data('key')));
        });
        var renew = type === 'new' ? false : $("#renew").prop("checked");

        SinMH.buyChapters(ids, renew, function (res) {
          if (res.status !== 0) {
            alertModal(res.data);
            return busy = false;
          }
          alertModal('购买成功', function (e) {
            window.location.reload();
          });
        });
      };
    statPrice(0);
    // 统计全本购买
    selectAll.click(function (e) {
      // 全选点击事件
      var status = selectAll.data('all');
      if (status !== 1) {
        newChapters.addClass('active');
        selectAll.data('all', 1);
        selectAll.text('取消全选');
      } else {
        newChapters.removeClass('active');
        selectAll.data('all', 0);
        selectAll.text('全选');
      }
      statPrice(1);
    });
    chapterFilter.click(function (e) {
      var status = chapterFilter.data('new');
      if (status !== 1) {
        chapterList.addClass('new');
        chapterFilter.data('new', 1);
        chapterFilter.text('显示全部章节');
      } else {
        chapterList.removeClass('new');
        chapterFilter.data('new', 0);
        chapterFilter.text('仅显示未购买');
      }
    });
    chapterList.find('li.new').click(function (e) {
      // 全选点击事件
      var $this = $(this);
      if ($this.hasClass('active')) {
        $this.removeClass('active');
      } else {
        $this.addClass('active');
      }
      statPrice(1);
    });
    $('#select-buy').click(function (e) { buyChapters(1); });
    $('#all-buy').click(function (e) { buyChapters(0); });


  }

  function _initVipTicket(comic_id) {
    $('#vip-ticket').click(function () {
      SinMH.vipTicket(comic_id, function (res) {
        if (res.status == 0) {
          alertModal('赠送成功');
        } else alertModal(res.data);
      });
    });
  }
  function _initGift(comic_id, chapter_id) {
    chapter_id = undefined === chapter_id ? 0 : chapter_id;
    // tip 自动购买功能由PHP程序完成，访问页面即自动判断并购买
    var modalGift = $("#modal-gift"), busy = false, ready = false, giftsForm = $("#gifts-form"), gifts = { content: '' },
      // render = baidu.template('gifts-template'),
      renderHtml = function () {
        // giftsForm.html(render(gifts));
      };
    var initGiftItemEvent = function () {
      giftsForm.find('.gift-item').unbind('click').click(function (e) {
        var $this = $(this), key = $this.data('key');
        for (var i in gifts.items) {
          if (i > 4) break;
          if (gifts.items[i].id == key) { gifts.items[i].active = true; }
          else { gifts.items[i].active = false; }
        }
        renderHtml();
        initGiftItemEvent();
      });
      giftsForm.find('.gift-num').unbind('change').change(function (e) {
        var $this = $(this), key = $this.data('key');
        var giftNum = $("input:radio[name='gift-num']:checked").val();
        for (var i in gifts.items) {
          if (i > 4) break;
          if (gifts.items[i].max_num < giftNum) gifts.items[i].num = gifts.items[i].max_num;
          else gifts.items[i].num = Math.min(giftNum, gifts.items[i].max_num);
        }
        renderHtml();
        initGiftItemEvent();
      });
      giftsForm.find('#gift-submit').on('click', function (e) {
        if (!ready) return alert('尚未初始化完成');
        if (busy) return alert('请勿重复提交');
        busy = true;
        var option = { comic_id: comic_id, chapter_id: chapter_id }, activeItem;
        for (var i in gifts.items) {
          if (i > 4) break;
          if (gifts.items[i].active) {
            activeItem = gifts.items[i];
            break;
          }
        }
        option.content = gifts.content ? gifts.content : activeItem.content;
        option.gift_id = activeItem.id;
        option.num = activeItem.num;

        // TODO 赠送礼物
        SinMH.giftSend(option, function (res) {
          modalGift.modal('hide');
          var $userCredit = $("#user-credit");
          if (res.status == 0) {
            $userCredit.text($userCredit.text() - activeItem.price * activeItem.num);
            alertModal('赠送成功');
          } else alertModal(res.data);
          busy = false;
        });
      });
      giftsForm.find('#gift-content').on('input', function (e) {
        gifts.content = $(this).val();
      });

    };
    // TODO 初始化
    SinMH.gifts(function (res) {
      ready = true;
      if (res.status > 0) return;
      gifts.items = res.items;
      gifts.items[0].active = true;
      renderHtml();
      initGiftItemEvent();
    });

    $('#gift').click(function () {
      modalGift.modal('show');
    });
  }

  return {
    init: function () {
      initUser();
      handleScrollTop();
      handleSearch();
      renderBookshelf();
      initBackground();
      initNotice();
      //chapterSort('.chapter-list-1',1);
    },
    initIndex: function () {

    },
    /**
     * 初始化漫画详情页
     * @param comic_id
     */
    initComic: function (comic_id) {
      // 漫画详情页初始化，章节排序/绑定订阅事件、投票、评分
      chapterSort();
      comicSubscribe(comic_id);
      //_initVipTicket(comic_id);
      //_initGift(comic_id);
      comicOpinion(comic_id);
      comicScore(comic_id);
      comicDescription();
    },
    /**
     * 初始化漫画购买页
     * @param comic_id
     */
    initComicBuy: function (comic_id) {
      _initComicBuy(comic_id);
    },
    /**
     * 初始化章节阅读页
     * @param id
     * @param name
     * @param comic_id
     * @param comic_name
     * @returns {boolean}
     */
    initChapter: function (id, name, comic_id, comic_name) {
      //在此添加需要在阅读页初始化/绑定的事件
      //加载下一页、跳转上/下一页、跳转上/下一章，页面预加载
      chapter.imageList = $("#images");
      chapter.historyIndex = chapter.currentIndex = getPage();
      chapter.imageList.drag();
      switchStyle();
      showImage();
      chapterScroll();
      chapterSort();
      chapterCollapse();
      chapterHotKeys();
      renderResServer('#res-server', 'res-template');

      // 初始化章节付费信息
      //_initChapterBuy(id);
      //_initVipTicket(comic_id,id);
      //_initGift(comic_id,id);
      initChapterEvent();
      return true;
    },
    getPage: getPage,
    jumpPage: jumpPage,
    prevPage: prevPage,
    nextPage: nextPage,
    prevChapter: prevChapter,
    nextChapter: nextChapter,
    setChapterScroll: setChapterScroll,
    switchStyle: switchStyle,
    alert: alertModal,
    confirm: confirmModal,
    toast: toastModal,

  };
}();