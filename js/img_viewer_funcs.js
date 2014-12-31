var radecs = {};

$(document).ready(function(){

  $('.imgcontrols button.left').click(function(){
    decrement_img($(this).parent().parent());
  });

  $('.imgcontrols button.right').click(function(){
    increment_img($(this).parent().parent());
  });

  $('.imgcontrols button.nextun').click(function(){
    find_next_unmarked();
  });

  //Bind finding the next of something to the button or to hitting enter in the input
  $('.imgcontrols button.next').click(function(){
    find_next_something($('.imgcontrols input.next').val());
  });
  $('.imgcontrols input.next').keyup(function(e){
    if(e.keyCode == 13) { $(this).trigger("enterKey"); }
  });
  $('.imgcontrols input.next').bind("enterKey",function(e) {
    find_next_something($('.imgcontrols input.next').val());
  });

  //Bind update_img to hitting enter on imgcontrols text field
  $('.imgcontrols input').keyup(function(e){
    if(e.keyCode == 13) { $(this).trigger("enterKey"); }
  });
  $('.imgcontrols input').bind("enterKey",function(e) {
    update_img($(this).parent().parent());
  });

  //Bind find_worksheets to hitting enter on anything in the header
  $('.head input').keyup(function(e){
    if(e.keyCode == 13) { $(this).trigger("enterKey"); }
  });
  $('.head input').bind("enterKey",function(e) {
    var $body = $(this).parent().parent().parent();
    find_worksheets($body.find('.imgandcontrols'));
  });

  //Also update the image on selection change
  $("div.head select[name='worksheet']").change(function() {
    update_img($('.imgandcontrols'));
  });

  //don't cache the data files
  $.ajaxSetup({ cache: false });

  find_worksheets($('.imgandcontrols'));  // this calls update_img when done
});

function increment_img($outerdiv) {
  var idxtext = $outerdiv.find('#rownum');
  var idx = parseInt(idxtext.val(), 10);
  ++idx;
  idxtext.val(idx);
  update_img($outerdiv);

  preload_id($outerdiv, idx+1, 1);
  preload_id($outerdiv, idx+2, 2);
  preload_id($outerdiv, idx+3, 3);
  preload_id($outerdiv, idx+4, 4);
  preload_id($outerdiv, idx+5, 5);
}

function decrement_img($outerdiv) {
  var idxtext = $outerdiv.find('#rownum');
  var idx = parseInt(idxtext.val(), 10);
  --idx;
  idxtext.val(idx);
  update_img($outerdiv);

  preload_id($outerdiv, idx-1, 1);
  preload_id($outerdiv, idx-2, 2);
  preload_id($outerdiv, idx-3, 3);
  preload_id($outerdiv, idx-4, 4);
  preload_id($outerdiv, idx-5, 5);
}

function update_img($outerdiv) {
  var rownum = parseInt($outerdiv.find('#rownum').val(), 10);
  var $imgcontainer = $outerdiv.find('.imgcontainer');
  var $statusspan = $outerdiv.parent().find('.loadinginfo');

  //var url = get_ss_url('cells') + '?alt=json&min-row='+
  //          rownum + '&max-row=' + rownum;
  var url = get_ss_url('list') + '?alt=json&sq=id=' + rownum;

  $statusspan.html('Looking up object...');

  //asynchronously get json
  $.ajax( {
    url: url,
    dataType: 'json'
  })
  .done(function(rowjson) {
    if (rowjson.feed.entry === undefined) {
      $statusspan.html('Could not find an ID ' + rownum + '!');
      $imgcontainer.html('No image');
      $outerdiv.find('div.imglinks button').prop('disabled', true);
      return;
    }

    //this is for cells-based feed
    //var objname = rowjson.feed.entry[0].content['$t'];
    //var ra = rowjson.feed.entry[1].content['$t'];
    //var dec = rowjson.feed.entry[2].content['$t'];

    //this is for list-based feed
    var objname = rowjson.feed.entry[0].title.$t;
    var ra = rowjson.feed.entry[0].content.$t.split(',')[0].split('ra: ')[1];
    var dec = rowjson.feed.entry[0].content.$t.split(',')[1].split('dec: ')[1];
    var comment = rowjson.feed.entry[0].content.$t.split(',')[3].split('comments: ');

    if (comment.length > 1) {
      comment = '. Comment: ' + comment[1];
    } else {
      comment = '';
    }

    // update the image and the links below it
    $imgcontainer.html('<img src="' + get_img_url(ra, dec, 'img')+'">');
    $outerdiv.find('form input[name=ra]').val(ra);
    $outerdiv.find('form input[name=dec]').val(dec);
    $outerdiv.find('form input[name=opt]').val($('#imgoptsinput').val());
    $outerdiv.find('form input[name=scale]').val($('#imgscaleinput').val());
    $outerdiv.find('form input[name=lon]').val(ra + 'd');
    $outerdiv.find('form input[name=lat]').val(dec + 'd');
    $outerdiv.find('div.imglinks button').prop('disabled', false);
    $statusspan.html('Loading image for ID ' + objname + comment);
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    $statusspan.html('Query failed: ' + textStatus + ' : ' + errorThrown);
    $imgcontainer.html('No image');
    $outerdiv.find('div.imglinks button').prop('disabled', true);
  });
}

function preload_id($outerdiv, id, preloadnum) {
  var rownum = parseInt($outerdiv.find('#rownum').val(), 10);
  var url = get_ss_url('list') + '?alt=json&sq=id=' + id;
  var preloadimgid;

  if (preloadnum === null) {
    preloadimgid = 'img#preload1';
  } else {
    preloadimgid = 'img#preload' + preloadnum;
  }
    //$preloadimg = $outerdiv.find('img#preload1');

  var createDone = function (preloadimgid) {
      return function(rowjson) {
        var $preloadimg = $outerdiv.find(preloadimgid);
        if (rowjson.feed.entry === undefined) {
          console.log('Could not preload ID ' + rownum + ' because it does not exist');
          return;
        }

        //this is for cells-based feed
        //var objname = rowjson.feed.entry[0].content['$t'];
        //var ra = rowjson.feed.entry[1].content['$t'];
        //var dec = rowjson.feed.entry[2].content['$t'];

        //this is for list-based feed
        var objname = rowjson.feed.entry[0].title.$t;
        var ra = rowjson.feed.entry[0].content.$t.split(',')[0].split('ra: ')[1];
        var dec = rowjson.feed.entry[0].content.$t.split(',')[1].split('dec: ')[1];

        // update the image and the links below it
        console.log('Preloading row/id ' + objname + ' sucessful.');
        var imageobj = new Image();
        imageobj.src = get_img_url(ra, dec, 'img');
      };
  };

  //asynchronously get json
  $.ajax( {
    url: url,
    dataType: 'json'
  })
  .done(createDone(preloadimgid))
  .fail(function(jqXHR, textStatus, errorThrown) {
    console.log('Could not preload ID ' + rownum + ' because the query failed');
  });
}

function get_ss_url(type) {
  var $wsselect = $("div.head select[name='worksheet']");

  return 'https://spreadsheets.google.com/feeds/' + type +
          '/' + $('#ssinfokey').val() + '/' + $wsselect.val() +
          '/public/basic';
}

function get_img_url(ra, dec, urltype) {
  var baseurl = null;
  var params = {"ra": ra,
                "dec": dec};

  params.scale = $('#imgscaleinput').val();
  params.opt = $('#imgoptsinput').val();

  if (urltype == 'img') {
    params.width = $('#imgwidth').val();
    params.height = $('#imgheight').val();
    baseurl = 'http://skyservice.pha.jhu.edu/DR10/ImgCutout/getjpeg.aspx?';
  } else if (urltype == 'navi') {
    baseurl = 'http://skyserver.sdss3.org/dr10/en/tools/chart/navi.aspx?';
  }

  return baseurl + $.param(params);
}

function find_next_unmarked() {
  find_next_something('');
}
function find_next_something(valtofind) {
  var startrow = $('#rownum').val();
  var url = get_ss_url('list') + '?alt=json&sq=candidateynmaybeblank=="'+valtofind+'"';
  var $statusspan = $('.loadinginfo');

  //synchronously get json
  $statusspan.html('Searching for next "'+valtofind+'"');
  var feedjson = $.parseJSON(
      $.ajax(
          {
             url: url,
             async: false,
             dataType: 'json'
          }
      ).responseText
  );

  // skip any that haven't been checked but are either at or below the current number
  var curridnum = parseInt($('#rownum').val(), 10);

  if (feedjson.feed.entry === undefined) {
    $statusspan.html('Failed to find anything with candidate status "'+valtofind+'"');
    return;
  }

  var idx = 0;
  var id = feedjson.feed.entry[idx].title['$t'];
  while (parseInt(id, 10) <= curridnum) {
    idx += 1;
    if (feedjson.feed.entry[idx] === undefined) {
      //at the end
      $statusspan.html('No more objects with candidate status "'+valtofind+'" remain.');
      return;

    }
    id = feedjson.feed.entry[idx].title['$t'];
  }

  $('#rownum').val(id);
  update_img($('.imgandcontrols'));

  //Now try to preload the next one.  Might fail if there is no next one
  var nextid = feedjson.feed.entry[idx+1].title['$t'];
  preload_id($('.imgandcontrols'), nextid);
}

function find_worksheets($toupdate) {
  var key = $('#ssinfokey').val().split('/')[0];
  var url = 'https://spreadsheets.google.com/feeds/worksheets/'+key+'/public/basic?alt=json';
  var $wsselect = $("div.head select[name='worksheet']");

  var failfunc = function(jqXHR, textStatus, errorThrown) {
    var errormsg = '';
    if (errorThrown !== null) {
      errormsg = ': ' + errorThrown;
    }
    console.log("Failed to find worksheets" + errormsg);

    $wsselect.empty();
    $wsselect.append('<option>No Worksheets found</option>');
  };

  $.ajax({
    url: url,
    dataType: 'json'
  }).done(function(rowjson) {
    var wsentries = rowjson.feed.entry;

    if ((wsentries === undefined) || (wsentries.length === 0)) {
      failfunc();
    } else {
      // success

      $wsselect.empty();

      for (i = 0; i < wsentries.length; i++) {
        var wstitle = wsentries[i].title.$t;
        var idlnk = wsentries[i].id.$t.split('/');

        $wsselect.append('<option value="' + idlnk[idlnk.length-1] + '">' + wstitle + '</option>');
      }

      if ($toupdate !== null) {
        update_img($toupdate);
      }
    }
  }).fail(failfunc);
}
