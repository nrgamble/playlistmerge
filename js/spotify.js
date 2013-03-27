require(['$api/models', '$views/buttons', '$views/utils/dnd', '$views/list#List', '$views/popup#Popup'],
function(models, buttons, dnd, List, Popup) {
      
  // Generate existing mashlist(s)
  var seedlist = mashlistForIndex(0);
  if (seedlist.playlists.length) {
    $mashlist = $('.mashlist');
    models.Playlist.createTemporary('mashlist-untitled').done(function (templist) {
      mashlistInit($mashlist, templist);

      templist.load(['tracks']).done(function(templist) {
        for (i = 0; i < seedlist.playlists.length; i++) {
          models.Playlist.fromURI(seedlist.playlists[i]).load(['name', 'tracks']).done(function (playlist) {
            mashlistAddPlaylist($mashlist, templist, playlist);
          });
        }
      });
    });
  }

  [].forEach.call(document.querySelectorAll('.dropzone'), function(dropBox) {
    dropBox.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/html', this.innerHTML);
      e.dataTransfer.effectAllowed = 'copy';
    }, false);
    dropBox.addEventListener('dragenter', function(e) { this.classList.add('over'); }, false);
    dropBox.addEventListener('dragleave', function(e) { this.classList.remove('over'); }, false);
    dropBox.addEventListener('dragover',  function(e) {
      if (e.preventDefault) { e.preventDefault(); }
      e.dataTransfer.dropEffect = 'copy';
      return false;
    }, false);

    dropBox.addEventListener('drop', function(e) {
      if (e.preventDefault) { e.preventDefault(); }
          
      var $dropzone  = $(this);
      $dropzone.removeClass('over empty');
        
      var $mashlist = $dropzone.parents('.mashlist');
        
      var index = $mashlist.attr('data-index');
          
      var mashlist = mashlistForIndex(index);
          
      var playlistURI = e.dataTransfer.getData('text');
          
      if (mashlist.playlists.indexOf(playlistURI) != -1) {
        return;
      }
          
      var templist;
          
      if ($mashlist.attr('data-uri') == '#') {
        models.Playlist.createTemporary('mashlist-untitled').done(function (t) {
          templist = t;

          mashlistInit($mashlist, templist);
                          
          mashlist.name = $mashlist.find('h3').text();
        });
      } else {
        templist = models.Playlist.fromURI($mashlist.attr('data-uri'));
      }
          
      templist.load(['tracks']).done(function(templist) {
        models.Playlist.fromURI(playlistURI).load(['name', 'tracks']).done(function (playlist) {
          mashlistAddPlaylist($mashlist, templist, playlist);
          mashlist.playlists.push(playlist.uri);
        });
      });
          
      mashlistSave(index, mashlist);
    }, false);
  });
    
      
  // Add listener for track changing
  models.player.load().done(function (player) {
    player.addEventListener('change:track', mashlistChangeTrack);
  });
      
  // Create temporary playlist for mashlist play history
  var playHistory;
  var listHistory;
  models.Playlist.createTemporary('mashlist-playhistory').done(function (history) {
    playHistory = history.uri;
    history.load('tracks').done(function() {
      listHistory = List.forCollection(history.tracks, {
        'fields' : ['star', 'share', 'track', 'artist', 'album'],
        'height' : 'fixed'
      });
      $('.history').append(listHistory.node);
      listHistory.init();
    });
  });

  // Initialize mashlist data and controls
  function mashlistInit($_mashlist, _templist) {
    $_mashlist.attr('data-uri', _templist.uri);
              
    var add = buttons.Button.withLabel('Add as Playlist');
    add.setIcon('img/add-icon.png');
    $_mashlist.find('.add').append(add.node).on('click', function () { mashlistCreatePlaylist($_mashlist); });
            
    $_mashlist.find('.play').on('click', function () { mashlistPlay($_mashlist); });
            
    $_mashlist.find('.remove').on('click', function () { mashlistRemove(this); });

    $_mashlist.find('.controls').show();
  }

  function mashlistAddPlaylist($_mashlist, _templist, _playlist) {
    _playlist.tracks.snapshot(0, 1000).done(function(snapshot) {
      _templist.tracks.add(snapshot.toArray());
    });
              
    var $playlists = $_mashlist.find('.playlists');
    if ($playlists.children('a').length == 0) {
      $playlists.text('');
    }
              
    var name = _playlist.uri.match(/user\/(.*)\/starred$/);
    name = name == null ? _playlist.name : 'Starred (' + name[1] + ')';
              
    $playlists.append($('<a/>').attr('href', _playlist.uri).text(name));
  }
      
  // Start playing a mashlist
  function mashlistPlay($_mashlist) {
    $('.mashlist').attr('data-playing', 0);
    $_mashlist.attr('data-playing', 1);
    models.player.load().done(function (player) {
      player.setShuffle(true);
      player.playContext(models.Playlist.fromURI($_mashlist.attr('data-uri')));
    });
  }
      
  // Listener for Spotify track changing
  function mashlistChangeTrack() {
    var $_mashlist = $('.mashlist[data-playing="1"]');
    models.player.load(['context', 'playing', 'track']).done(function (player) {
      if (player.playing && player.context.uri == $_mashlist.attr('data-uri')) {
        models.Playlist.fromURI(playHistory).load(['tracks']).done(function (history) {
          history.tracks.add(player.track);
          listHistory.refresh();
          $('.sp-list-item').on('dblclick', function (e) {
            e.stopImmediatePropagation();
          });
        });
      }
    });
  }
      
  // Create a playlist from a mashlist
  function mashlistCreatePlaylist($_mashlist) {
    models.Playlist.create($_mashlist.find('h3').text()).done(function (playlist) {
      playlist.load(['tracks']).done(function (_playlist) {
        models.Playlist.fromURI($_mashlist.attr('data-uri')).load(['tracks']).done(function (templist) {
          templist.tracks.snapshot(0, 1000).done(function(snapshot) {
            _playlist.tracks.add(snapshot.toArray());
          });
        });
      });
    });
  }
      
  // Remove a mashlist
  function mashlistRemove(_remove) {
    var _popup;
        
    var $_div = $('<div/>');
    $_div.append('Are you sure?&nbsp;&nbsp;');
        
    var $_yes = $('<span/>');
    var _yes  = buttons.Button.withLabel('Yes');
    _yes.setAccentuated(true);                
    $_yes.append(_yes.node).on('click', function () { window.location.reload(); });
        
    var $_no = $('<span/>');
    var _no  = buttons.Button.withLabel('No');
    $_no.append(_no.node).on('click', function () { _popup.dispose(); });
        
    $_div.append($_no).append($_yes);
        
    _popup = Popup.withContent($_div.get()[0], 218, 24);
    _popup.showFor(_remove);
  }
      
});