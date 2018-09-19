//ローカルストレージを全て削除
//localStorage.clear();

// APIキーの設定とSDK初期化
var appKey    = "ac239658c2abc8cefb210157a247f845e8da1edb1d70853b17b336740feea5b6";
var clientKey = "3a6cb6e1dae538fb1f3f0108aeda869fa48b8030c12f549a9a4ff24b40a5c165";
var ncmb = new NCMB(appKey, clientKey);

// ログイン中の会員
var currentLoginUser;

// グローバル変数
var postId;
var couponId;
var fadeOption = {animation: "fade"};
var loadingFlag = false; // 読み込み中はtrueにして、複数回発生しないようにする

// プッシュ通知
document.addEventListener("deviceready", function(){
    console.log("deviceready");
    // デバイストークンを取得してinstallationに登録する
    window.NCMB.monaca.setDeviceToken(
        "ac239658c2abc8cefb210157a247f845e8da1edb1d70853b17b336740feea5b6",
        "3a6cb6e1dae538fb1f3f0108aeda869fa48b8030c12f549a9a4ff24b40a5c165",
        "YOUR_FCM_SENDER_ID"
    );
},false);

/*****************
  イベントの定義
******************/
$(document)
.on("init", "#naviPage", function(){})
.on("init", "#tabbarPage", function(){})
.on("init", "#timetablePage", function(){autoLogin();})
.on("init", "#timetableDetailPage", function(){displayCellDetail();})
.on("init", "#newsPage", function(){})
.on("show", "#newsPage", function(){})
.on("init", "#newsDetailPage", function(){getPostContent();})
.on("init", "#mapPage", function(){})
.on("show", "#mapPage", function(){showMap();})
.on("init", "#couponPage", function(){showCouponList();})
.on("init", "#couponDetailPage", function(){getCouponContent();})
.on("init", "#othersPage", function(){})
.on("init", "#othersDetailPage", function(){})
.on("init", "#profilePage", function(){showProfile();})
.on('click', "#replaceRegisterPage", function(){replaceRegisterPage();})
.on('click', "#onLoginBtn", function(){onLoginBtn();})
.on('click', "#replaceLoginPage", function(){replaceLoginPage();})
.on('click', "#onRegisterBtn", function(){onRegisterBtn();})
.on('click', '.cell', function(){pushTimetableDetail.call(this, 'click');})
.on('click', '#timetableSave', function(){timetableSave();})
.on('click', '#timetableRemove', function(){timetableRemove();})
.on("click", ".post", function () {pushNewsDetail.call(this, 'click');})
.on("click", "#pushNewsSearchButton", function () {pushNewsSearchPage();})
.on("click", "#pushMapSearchButton", function () {pushMapSearchPage();})
.on("click", ".coupon", function () {pushCouponDetail.call(this, 'click');})
.on("click", "#pushCouponSearchButton", function () {pushCouponSearchPage();})
.on("click", "#couponSearchButton", function () {searchCoupon();})
.on("click", "#pushProfile", function () {pushProfile();})
.on("click", "#pushProfileEdit", function () {pushProfileEdit();})
.on("click", "#pushLoginInfo", function () {pushLoginInfo();})
.on("click", "#logout", function () {logout();})
.on('load keyup blur', '#search', function() {searchExtraction();});
//.on("prechange", "#newsPage ons-tabbar", function(){tabChange();});

ons.ready(function(){
    showPostList();
});

// scrollだけ第２引数にイベントの対象を取れないから別枠です
// infiniteScrollをinitイベントで設定するとnews内のons-tabの数だけ処理が実行されてしまう
$(document).on("init", "#newsPage #newsTab1", function(){
    $('#newsPage ons-tabbar .page__content').on('scroll',function(){ infiniteScroll.call(this, 'scroll')});
});
$(document).on("init", "#newsSearchPage", function(){
    $('#newsSearchPage .page__content').on('scroll', function(){ infiniteScroll.call(this, 'scroll')});
});

$(document).on('click', 'a', function(event){
    if (event.currentTarget.href.match(/#/)) {
    }else{
      event.preventDefault();
      window.open(event.currentTarget.href,"_blank", "location=no");
    }
});

/*****************
  関数の定義
******************/

//tabbar.html
function autoLogin(){
    // var local = "NCMB/" + appKey + "/currentUser";
    // if(localStorage.getItem(local)){
    currentLoginUser = ncmb.User.getCurrentUser(); 
    if(currentLoginUser){
        $("#progressModal").show();
        $("#testModal").show();
        //currentLoginUser = JSON.parse(localStorage.getItem(local));
        var mailAddress = currentLoginUser.mailAddress;
        var password = currentLoginUser.password;
        ncmb.User.loginWithMailAddress(mailAddress, password)
            .then(function(user) {
                currentLoginUser = ncmb.User.getCurrentUser();
                timetable = currentLoginUser.timetable;
                if(currentLoginUser.name == undefined) {
                    document.getElementById("navigator").replacePage("page/member/form.html", fadeOption);
                } else {
                    displayCell();
                    document.getElementById("navigator").popPage();
                }
                $("#progressModal").hide();
            })
            .catch(function(error) {
                document.getElementById("navigator").pushPage("page/member/login.html", fadeOption);
                $("#progressModal").hide();
            });
    } else {
        pushLoginPage();
    }
}
function logout(){
    // var option = {buttonLabels:["いいえ","はい"]};
    // ons.notification.confirm('本当にログアウトしますか？',option)
        ons.notification.confirm({
            title: 'ログアウト',
            messageHTML: '本当にログアウトしますか？',
            buttonLabels: ['いいえ', 'はい'],
            animation: 'default',
            cancelable: true,
            callback: function(index) {
                if(index == -1) {
                    //console.log('confirmのコールバック:キャンセル');
                } else if(index == 0) {
                    //console.log('confirmのコールバック:No');
                } else if(index == 1) {
                    //console.log('confirmのコールバック:Yes');
                    ncmb.User.logout()
                    .then(function() {
                        alert("ログアウトしました。");
                        document.getElementById("navigator").pushPage("page/member/login.html", fadeOption);
                    });
                }
            }
        })
}
function pushLoginPage(){
    document.getElementById("navigator").pushPage("page/member/login.html", fadeOption);
}

// register.html
function replaceLoginPage(){
    document.getElementById("navigator").replacePage("page/member/login.html", fadeOption);
}
function onRegisterBtn() {
    var mailAddress = $("#reg_mailAddress").val();
    ncmb.User.requestSignUpEmail(mailAddress)
            .then(function(user){
                alert("新規登録メールを配信しました。届いたメールに記載されているURLにアクセスし、パスワードを登録してください。");
                document.getElementById("navigator").replacePage("page/member/login.html",fadeOption);
            })
            .catch(function(error){
                alert("新規登録メールの配信に失敗しました。");
                $("#reg_mailAddress").val("");
            });
};

// login.html
function replaceRegisterPage(){
    document.getElementById("navigator").replacePage("page/member/register.html", fadeOption);
}
function onLoginBtn() {
    var mailAddress = $("#login_mailAddress").val();
    var password = $("#login_password").val();
    ncmb.User.loginWithMailAddress(mailAddress, password)
        .then(function(user) {
            alert("ログインに成功しました。");
            currentLoginUser = ncmb.User.getCurrentUser();
            timetable = currentLoginUser.timetable;
            if(currentLoginUser.name == undefined){
                document.getElementById("navigator").replacePage("page/member/form.html", fadeOption);
            } else {
                displayCell();
                document.getElementById("navigator").popPage();
            }
        })
        .catch(function(error) {
            alert("ログインに失敗しました。");
            $("#login_mailAddress").val("");
            $("#login_password").val("");
        });
};

// form.html
function onFormBtn() {
    var name = $("#reg_name").val();
    var grade = $("#reg_grade").val();
    var faculty = $("#reg_faculty").val();
    var department = $("#reg_department").val();
    var campus = $("#reg_campus").val();
    var timetable = new Object();
        timetable.mon = [];
        timetable.tue = [];
        timetable.wed = [];
        timetable.thu = [];
        timetable.fri = [];
        timetable.sat = [];
        for(var i=0; i<6; i++){
        timetable.mon[i] = {"subject":"", "teacher":"", "room":"", "color":"", "memo":""};
        timetable.tue[i] = {"subject":"", "teacher":"", "room":"", "color":"", "memo":""};
        timetable.wed[i] = {"subject":"", "teacher":"", "room":"", "color":"", "memo":""};
        timetable.thu[i] = {"subject":"", "teacher":"", "room":"", "color":"", "memo":""};
        timetable.fri[i] = {"subject":"", "teacher":"", "room":"", "color":"", "memo":""};
        timetable.sat[i] = {"subject":"", "teacher":"", "room":"", "color":"", "memo":""};
        }      
    currentLoginUser = ncmb.User.getCurrentUser();
    currentLoginUser.set("name", name)
        .set("grade", grade)
        .set("faculty", faculty)
        .set("department", department)
        .set("campus", campus)
        .set("timetable", timetable)
        .update();
        document.getElementById("navigator").popPage();
};

//timetable.html
function displayCell(){
    for(var i=0; i<6; i++){
    $(".cell[data-num='"+i+"'][data-dow='mon']").html("<div class='cellbox' style='background:"+timetable.mon[i].color+";'><div class='celltop'><span>"+timetable.mon[i].subject+"</span></div><div class='cellbot'><span>"+timetable.mon[i].room+"</span></div></div>");
    $(".cell[data-num='"+i+"'][data-dow='tue']").html("<div class='cellbox' style='background:"+timetable.tue[i].color+";'><div class='celltop'><span>"+timetable.tue[i].subject+"</span></div><div class='cellbot'><span>"+timetable.tue[i].room+"</span></div></div>");
    $(".cell[data-num='"+i+"'][data-dow='wed']").html("<div class='cellbox' style='background:"+timetable.wed[i].color+";'><div class='celltop'><span>"+timetable.wed[i].subject+"</span></div><div class='cellbot'><span>"+timetable.wed[i].room+"</span></div></div>");
    $(".cell[data-num='"+i+"'][data-dow='thu']").html("<div class='cellbox' style='background:"+timetable.thu[i].color+";'><div class='celltop'><span>"+timetable.thu[i].subject+"</span></div><div class='cellbot'><span>"+timetable.thu[i].room+"</span></div></div>");
    $(".cell[data-num='"+i+"'][data-dow='fri']").html("<div class='cellbox' style='background:"+timetable.fri[i].color+";'><div class='celltop'><span>"+timetable.fri[i].subject+"</span></div><div class='cellbot'><span>"+timetable.fri[i].room+"</span></div></div>");
    $(".cell[data-num='"+i+"'][data-dow='sat']").html("<div class='cellbox' style='background:"+timetable.sat[i].color+";'><div class='celltop'><span>"+timetable.sat[i].subject+"</span></div><div class='cellbot'><span>"+timetable.sat[i].room+"</span></div></div>");
    }
}
function pushTimetableDetail(){
    cellNum = $(this).data("num");
    cellDow = $(this).data("dow");
    document.getElementById("navigator").pushPage('page/timetable/timetable-detail.html');
}
function pushNoclass(){
    document.getElementById("navigator").pushPage('page/timetable/noclass.html',fadeOption);
}
//timetable-detail.html
function displayCellDetail(){
    $("#subject").val(timetable[cellDow][cellNum].subject);
    $("#teacher").val(timetable[cellDow][cellNum].teacher);
    $("#room").val(timetable[cellDow][cellNum].room);
    $("[name=color]").val([timetable[cellDow][cellNum].color]);
    $("#memo").val(timetable[cellDow][cellNum].memo);
}
function timetableSave(){
    var subject = $("#subject").val();
    var teacher = $("#teacher").val();
    var room = $("#room").val();
    var color = $("[name=color]:checked").val();
    var memo = $("#memo").val();
    timetable = currentLoginUser.timetable;
    timetable[cellDow][cellNum] = {"subject":subject,"teacher":teacher,"room":room,"color":color,"memo":memo};
    currentLoginUser.set("timetable", timetable).update();
    displayCell();
    document.getElementById("navigator").popPage();
}
function timetableRemove(){
    var subject = $("#subject").val("");
    var teacher = $("#teacher").val("");
    var room = $("#room").val("");
    var color = $("[name=color]").val([""]);
    var memo = $("#memo").val("");
}

// news.html
function getPostList(url, targetPage){
    $("#progressModal").show();
    $.ajax({type: 'GET',　url:  url,　dataType: 'json'})
    .done(function(json, textStatus, request){
        var totalPages = request.getResponseHeader('X-WP-TotalPages');
        var post = [];
        for (var i=0; i<json.length; i++) {
            post[i] = "<div class='post' data-id='"+json[i].id+"'><img alt='' style='width:100%;' src='"+json[i]['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url']+"'><li>"+json[i].title.rendered+"</a></li></div>";
        }
        var nextLink = "<div class='nextLink' data-currentpage='1' data-totalpages='"+totalPages+"' data-defaulturl='"+url+"'></div>";
        $(targetPage + " .postList").append(post);
        $(targetPage + " .postList").append(nextLink);
        $("#progressModal").hide();
    })
    .fail(function(){
        $("#progressModal").hide();
    });
}

function infiniteScroll(){
  if(!loadingFlag) {
      var tab = $(this);
      if (tab[0].scrollHeight <= tab.height() + tab.scrollTop()) {
          loadingFlag = true;
          $("#progressModal").show();
          var tabPageId = "#" + $(tab).parent('ons-page').attr('id');
          var currentPage = $(tabPageId + " .nextLink").data("currentpage");
          var totalPages = $(tabPageId + " .nextLink").data("totalpages");
          var defaulturl = $(tabPageId + " .nextLink").data("defaulturl");
          if(currentPage < totalPages){
              var nextPage = currentPage + 1;
              var nextUrl = defaulturl+"&page="+nextPage;
              $.ajax({type: 'GET', url:  nextUrl, dataType: 'json'})
              .done(function(json, textStatus, request){
                  var post = [];
                  for (var i=0; i<json.length; i++) {
                      post[i] = "<div class='post' data-id='"+json[i].id+"'><img alt='' style='width:100%;' src='"+json[i]['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url']+"'><li>"+json[i].title.rendered+"</a></li></div>";
                  }
                  $(tabPageId + " .postList").append(post);
                  $(tabPageId + " .nextLink").remove();
                  var nextLink = "<div class='nextLink' data-currentpage='"+nextPage+"' data-totalpages='"+totalPages+"' data-defaulturl='"+defaulturl+"'></div>";
                  $(tabPageId + " .postList").append(nextLink);
                  loadingFlag = false; // 次のページがない場合はloadingFlagをtrueにしたままにして処理を発生しないようにしようと思ったけど、それだと他のタブまでイベントが止まってしまうのでやっぱりfalseのままで
                  $("#progressModal").hide();
              })
              .fail(function(){
                  loadingFlag = false;
                  $("#progressModal").hide();
              });
          } else {
              loadingFlag = false;
              $("#progressModal").hide();//早すぎて見えない
          }
      }
  }
}


function showPostList(){
    getPostList("https://news.penmark.jp/wp-json/wp/v2/posts?_embed","#newsTabCoupon");//pickup
    getPostList("https://news.penmark.jp/wp-json/wp/v2/posts?_embed","#newsTabSeries");//ranking
    getPostList("https://news.penmark.jp/wp-json/wp/v2/posts?_embed&categories=7","#newsTabTop");//life
    getPostList("https://news.penmark.jp/wp-json/wp/v2/posts?_embed&categories=3","#newsTabColumn");//event
    getPostList("https://news.penmark.jp/wp-json/wp/v2/posts?_embed&categories=8","#newsTabAcademic");//community
}
function pushNewsDetail(){
    postId = $(this).data("id");
    document.querySelector('#navigator').pushPage('page/news/news-detail.html');
}
function pushNewsSearchPage(){
    document.querySelector('#navigator').pushPage('page/news/news-search.html', fadeOption);
}

// function tabChange(){
//     var tabbar = $("#newsPage tabbar");
//     var tabQuantity = $('#newsPage ons-tab').length;
//     var tabWidthSum = 0;
//     for(var i=0; i<tabQuantity; i++){
//       tabWidthSum = tabWidthSum + $("#newsPage ons-tab").eq(i).width();
//     };
//     var tabExtraDistance = tabWidthSum - $('#newsPage .tabbar').width();
//     var scrollDestination = ( tabExtraDistance / (tabQuantity - 1) ) * ( event.index );
//     $('#newsPage .tabbar').animate({ scrollLeft: scrollDestination }, 'normal');
// }

//news-detail.html
function getPostContent(){
    $.getJSON("https://news.penmark.jp/wp-json/wp/v2/posts/"+postId+"/?_embed",function(data) {
        $(function() {
            $('.content').append("<img alt='' style='width:100%;' src="+data['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url']+">");
            $('.content').append(data.content.rendered);
        });
    })
}
//news-search.html
function searchNews(){
    var searchWord = $("#newsSearch").val();
    getPostList("https://news.penmark.jp/wp-json/wp/v2/posts?_embed&search=" + searchWord, "#newsSearchPage");
}

// map.html
function pushMapDetail(){
    postId = $(this).data("id");
    document.querySelector('#navigator').pushPage('page/map/map-detail.html');
}
function pushMapSearchPage(){
    document.querySelector('#navigator').pushPage('page/map/map-search.html', fadeOption);
}
function showMap(){
    var div = document.querySelector("#mapPage #map_canvas");
    var map = plugin.google.maps.Map.getMap(div, {
        'controls': {
            'compass': true,
            'indoorPicker': true,
            'myLocationButton': true,
            'myLocation': true,
        },
        'camera' : {
            target: {lat: 35.552581100000005, lng: 139.649},
            zoom: 16,
            bearing: 106,      
        },
    });
    $('#mapPage .page__background').css('background-color', 'rgba(0,0,0,0)');
    map.one(plugin.google.maps.event.MAP_READY, function() {
      //mapが準備できました
    });
}
// function showMap(){
//     mapboxgl.accessToken = 'pk.eyJ1IjoicGVubWFyayIsImEiOiJjamZkY2s5aDQzdzg0MndxaDJxbXo3bWQxIn0.ME3JvH5zC_iH0Xp7FMJgBQ';
//     var map = new mapboxgl.Map({
//         container: 'map',
//         style: 'mapbox://styles/penmark/cjfdg2khg02ns2roslndvokr2',
//         center: [139.65028860000007, 35.552581100000005],
//         zoom: 15.5,
//         bearing: 106
//     });
//     // 現在地を取得 Add geolocate control to the map.
//     map.addControl(new mapboxgl.GeolocateControl({
//         positionOptions: {
//             enableHighAccuracy: true
//         },
//         trackUserLocation: true
//     }), 'top-right');
// }
// function showMarker(){
//     //markerの定義
//     var marker = [];
//     for(var i = 1; i < 18; i++){
//         marker[i] = document.createElement('div');
//         marker[i].id = 'marker' + i.toString();
//         marker[i].classList.add('marker');
//     };
//     //positionの定義
//     var position = [];
//     position[1] = [139.64831,35.554466];//独立館
//     position[2] = [139.64854973469272,35.554070368024156];//第4校舎A棟
//     position[3] = [139.64867924073627,35.55448183373703];//第4校舎B棟
//     position[4] = [139.64934958079908,35.555262585827094];//第3校舎
//     position[5] = [139.64872308911436,35.555544013236855];//第6校舎
//     position[6] = [139.65021641836438,35.55309673312361];//第28校舎
//     position[7] = [139.64815770869984,35.55353763134076];//図書館メディア
//     position[8] = [139.65052652851068,35.55334551889739];//ITC
//     position[9] = [139.65045338850354,35.55360608173444];//第7校舎（AV富士山）
//     position[10] = [139.65068592996465,35.553309626008584];//第7校舎（理工）
//     position[11] = [139.64939026528054,35.55373192147577];//食堂
//     position[12] = [139.64929114245518,35.554229386341504];//塾生会館
//     position[13] = [139.64734898492856,35.552046116621355];//協生館
//     position[14] = [139.647245565202,35.55106350281868];//駐輪場
//     position[15] = [139.64996554784238,35.5538911262269];//生協
//     position[16] = [139.64942750681348,35.55325718124007];//来往舎
//     position[17] = [139.64984493803246,35.55151675065308];//慶應一貫教育校
//     //markerをmapのpositionに追加
//     for(var i = 1; i < 18; i++){
//         new mapboxgl.Marker(marker[i]).setLngLat(position[i]).addTo(map);
//     }
// }
function searchExtraction() {
    var $searchInput = $('#search'); // 入力エリア
    var $searchElem = $('.extra'); // 絞り込む要素
    var excludedClass = 'is-excluded'; // 絞り込み対象外の要素に付与するclass
    var keywordArr = $searchInput.val().toLowerCase().replace('　', ' ').split(' '); // 入力文字列を配列に格納
    $searchElem.removeClass(excludedClass).show();// 現在非表示にしているリストを表示する
    for (var i = 0; i < keywordArr.length; i++) {
        for (var j = 0; j < $searchElem.length; j++) {
            var thisString = $searchElem.eq(j).text().toLowerCase();
            if(thisString.indexOf(keywordArr[i]) == -1) { // 入力文字列と一致する文字列がない場合
                $searchElem.eq(j).addClass(excludedClass); // 絞り込み対象外のclass付与
            }
        }
    }
    $('.' + excludedClass).hide(); // 絞り込み対象外の要素の非表示
}

//coupon.html
function getCouponList(url, appendTarget){
    var coupon = [];
    //$.ajaxSetup({ async: false });
    $.getJSON(url,function(data) {
        $(function() {
            for (var i=0; i<data.length; i++) {
                coupon[i] = "<div class='coupon' data-id='"+data[i].id+"'><img alt='' style='width:100%;' src='"+data[i]['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url']+"'><li>"+data[i].title.rendered+"</a></li></div>";
            }
            $(appendTarget).append(coupon);
        });
    })
  }
function pushCouponDetail(){
    couponId = $(this).data("id");
    document.querySelector('#navigator').pushPage('page/coupon/coupon-detail.html');
}
function pushCouponSearchPage(){
    document.querySelector('#navigator').pushPage('page/coupon/coupon-search.html', fadeOption);
}

function showCouponList(){
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList0");//top
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList1");//ramen
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList2");//cafe
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList3");//western
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList4");//set
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList5");//izakaya
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList6");//salon
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed",".couponList7");//others
}
// function couponCarousel(){
//   var couponCarousel = document.getElementById("couponCarousel");

//   //タブボタンの数を取得
//   var tabQuantity = $('#couponPage .tab-switch_item').length;
//   //タブの長さとボディの長さの差分を取得
//   var tabExtraDistance = $('#couponPage .tab-switch_inner').width() - $('#couponPage .tab-switch').width();

//   couponCarousel.addEventListener('postchange', function(event) {
//       //クラスを調整
//       $('#couponPage .tab-switch_item').removeClass('active');
//       $('#couponPage .tab-switch_item:nth-child(' + ( event.activeIndex + 1 ) + ')').addClass('active');
//       //スクロールするべき距離を取得。タブ全体の長さ / ( タブの個数 - 1 ) * スライドの現在地
//       var scrollDestination = ( tabExtraDistance / (tabQuantity - 1) ) * ( event.activeIndex );
//       //スクロール位置を調整
//       $('#couponPage .tab-switch').animate({ scrollLeft: scrollDestination }, 'normal');
//   });

//   $(document).on('click', '#couponPage .tab-switch_item', function () {
//     var index = $('#couponPage .tab-switch_item').index(this);
//     couponCarousel.setActiveIndex(index);
//   });
// }
//coupon-detail.html
function getCouponContent(){
    $.getJSON("https://coupon.penmark.jp/wp-json/wp/v2/posts/"+couponId+"/?_embed",function(data) {
        $(function() {
            $('.couponContent').append("<img alt='' style='width:100%;' src="+data['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url']+">");
            $('.couponContent').append(data.content.rendered);
        });
    })
}
//coupon-search.html
function searchCoupon(){
    var searchWord = $("#couponSearch").val();
    getCouponList("https://coupon.penmark.jp/wp-json/wp/v2/posts?_embed&search=" + searchWord, ".couponSearchResult");//top
}

//others.html
function pushOthersDetail(){
    var options = {animation: "slide"};
    document.querySelector('#navigator').pushPage('page/others/others-detail.html', options);
}
function openTwitter() {
    window.open("https://twitter.com/penmarkjp", '_system', 'location=yes');
    return false;
}
function openPenmark() {
    window.open("https://penmark.jp", '_blank', 'location=no');
    return false;
}

function pushProfile(){
    document.querySelector('#navigator').pushPage('page/others/profile.html');
}
//profile.html
function showProfile(){
    $("#name").append(currentLoginUser.name);
    $("#mailAddress").append(currentLoginUser.mailAddress);
    $("#grade").append(currentLoginUser.grade);
    $("#faculty").append(currentLoginUser.faculty);
    $("#department").append(currentLoginUser.department);
    $("#campus").append(currentLoginUser.campus);
}
function pushProfileEdit(){
    document.querySelector('#navigator').pushPage('page/others/profile-edit.html');
}
function pushLoginInfo(){
    document.querySelector('#navigator').pushPage('page/others/login-info.html');
}
//profile-edit.html
function saveProfileEdit(){

}