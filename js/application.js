/* Playlist Merge */

var MERGELISTS = localStorage['playlistmerge.mergelists'];
if (typeof MERGELISTS == 'undefined') {
  MERGELISTS = [];
} else {
  MERGELISTS = JSON.parse(MERGELISTS);
}

$(function () {
  
  $('h3').on('click', function (e) {
    var $this  = $(this);
    var $input = $this.siblings('input');
    
    $this.hide();
    $input.val($.trim($this.text())).show().select();
  });
  
  $('.header input').on('blur keypress', function (e) {
    if (event.type == 'blur' || event.keyCode == 13) {
      var $this = $(this);
      var $span = $this.siblings('h3');
      var name  = $.trim($this.val());
      
      $this.hide();
      if (name.length) {
        $span.text(name);
        var _index      = $span.parents('.mergelist').attr('data-index');
        var _mergelist  = mergelistForIndex(_index);
        _mergelist.name = name;
        //mergelistSave(_index, _mergelist);
      }
      $span.show();
    }
  });
  
});

function mergelistForIndex(_index) {
  if (MERGELISTS.length) {
    _mergelist = MERGELISTS[_index];
  } else {
    _mergelist = {
      'name'      : '',
      'playlists' : []
    };
  }
    return _mergelist;
}
      
function mergelistSave(_index, _mergelist) {
  MERGELISTS[_index] = _mergelist;
  localStorage['playlistmerge.mergelists'] = JSON.stringify(MERGELISTS);
}