/* Playlist Merge */

var MASHLISTS = localStorage['playlistmerge.mashlists'];
if (typeof MASHLISTS == 'undefined') {
  MASHLISTS = [];
} else {
  MASHLISTS = JSON.parse(MASHLISTS);
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
        var _index      = $this.parents('.mashlist').attr('data-index');
        var _mashlist  = mashlistForIndex(_index);
        _mashlist.name = name;
        //mashlistSave(_index, _mashlist);
      }
      $span.show();
    }
  });
  
});

function mashlistForIndex(_index) {
  if (MASHLISTS.length) {
    _mashlist = MASHLISTS[_index];
  } else {
    _mashlist = {
      'name'      : '',
      'playlists' : []
    };
  }
    return _mashlist;
}
      
function mashlistSave(_index, _mashlist) {
  MASHLISTS[_index] = _mashlist;
  localStorage['playlistmerge.mashlists'] = JSON.stringify(MASHLISTS);
}