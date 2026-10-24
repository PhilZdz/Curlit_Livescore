// Version 2.0rc1 from 12.10.26

window.CurlitLiveCommon = {
    setOnlineHeader($sessionHeader, online) {
        var updateIcon;
        if (document.getElementById('RefreshButton') != null)
            updateIcon = document.getElementById('RefreshButton');
        if (online) {
            $sessionHeader.removeClass('offline');
            $sessionHeader.addClass('online');
            if (updateIcon != null) {
                updateIcon.src = '../general/online.png';
                updateIcon.style.removeProperty('width');
            }
        }
        else {
            $sessionHeader.removeClass('online');
            $sessionHeader.addClass('offline');
            if (updateIcon != null) {
                updateIcon.src = '../general/offline.png';
                updateIcon.style.removeProperty('width');
            }
        }
    }
};