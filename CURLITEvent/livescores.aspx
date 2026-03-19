<%@ Page Language="C#" MasterPageFile="~/Site.Master" CodeBehind="livescores.aspx.cs" Inherits="CURLITEvent.aspnet.livescores" EnableViewState="False" Buffer="True" EnableSessionState="True" AutoEventWireup="True" %>

<asp:Content ID="ContentStyle" ContentPlaceHolderID="HeaderStyleTop" Runat="Server">  
    <script src="https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.7/signalr.min.js"></script>
    <script src="../Scripts/jquery-3.7.1.min.js"></script>
    <script src="../Scripts/livescores.js"></script>
    <link href="../CSS/bootstrap.min.css" rel="stylesheet">
    <link href="../CSS/livescores.css" rel="stylesheet" type="text/css" />
<style type="text/css">
    .svg-container {
        display: inline-block; /* or inline */
        vertical-align: middle; /* or top, middle, etc. as needed */
    }

    .svg-icon {
        height: 1.2em; /* This will be relative to the font size */
        width: auto;
    }
</style>
</asp:Content>
<asp:Content ID="Content_LiveScores" ContentPlaceHolderID="ContentMain" runat="Server">
    <table width="100%"><tr valign="bottom">
    <td><p class="llb"><asp:Label ID="lSubtitle" runat="server">Current</asp:Label></p>
    </td>
    <td><p class="sr"><asp:Label runat="server" ID="SessionComment" Text="" /></p></td>
    </tr></table>
    <asp:HiddenField runat="server" ID="HiddenSeason" />
    <asp:HiddenField runat="server" ID="HiddenCompetition" />
    <asp:HiddenField runat="server" ID="HiddenEventID" />
    <asp:HiddenField runat="server" ID="HiddenSessionID" />
    <div id="scoreboard" class="container-wide">
        <div id="loader">&nbsp;</div>
        <div id="session-header" class="offline"></div>
    </div>

    <div id="template" class="row">
        <div class="col-12">
            <div class="matchup-tile">
                <header>
                    <div class="header-content">
                        <span class="sheet"></span>
                        <span class="left-text"></span>

                        <span class="middle-text"></span>

                        <div class="d-flex justify-content-end align-items-center right-area">
                            <span class="me-1"></span>
                            <div class="d-flex">
                                <a class="btnStats" href="#" title="Line-Up/Stats">
                                    <img alt="Line-Up/Stats" border="0" src="../general/proc-button.svg" class="img-fluid">
                                </a>
                                <a class="btnGraphics" href="#" title="Game Center">
                                    <img alt="Game Center" border="0" src="../general/shot-button.svg" class="img-fluid">
                                </a>
                            </div>
                        </div>
                    </div>
                </header>
                <div class="dynamic-content">
                    <div class="col-12">
                        <div class="d-flex justify-content-between">
                            <div class="summary">
                                <div class="home">
                                    <img class="flag" src="">
                                    <span class="team-name"></span>
                                    <span class="score"></span>
                                    <span class="team-history"></span>
                                </div>
                                <span class="separator">-</span>
                                <div class="away">
                                    <span class="score"></span>
                                    <span class="team-name"></span>
                                    <img class="flag" src="">
                                    <span class="team-history"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Scoreboard -->
                        <table class="scoreboard">
                            <thead>
                            </thead>
                            <tbody>
                                <tr>
                                </tr>
                                <tr>
                                </tr>
                            </tbody>
                        </table>

                        <!-- Details (LSD, Stats) -->
                        <span class="details">Last Stone Draw</span>
                        <table class="details-content">
                            <tbody>
                                <tr>
                                    <td class="noc"></td>
                                    <td class="lsfe"></td>
                                    <td class="lsd-detail"></td>
                                    <td class="lsd-detail"></td>
                                    <td class="lsd"></td>
                                    <td class="spacer"></td>
                                    <td class="score"><span></span></td>
                                </tr>
                                <tr>
                                    <td class="noc"></td>
                                    <td class="lsfe"></td>
                                    <td class="lsd-detail"></td>
                                    <td class="lsd-detail"></td>
                                    <td class="lsd"></td>
                                    <td class="spacer"></td>
                                    <td class="score"><span></span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div runat="server" id="Hint_1" visible="true">
    <p class="xxsl">
        Click on button <span class="svg-container"><img alt="Line-Up/Stats" border="0" src="../general/proc-button.svg" class="svg-icon"></span> for Stats and <span class="svg-container"><img alt="Game Center" border="0" src="../general/shot-button.svg" class="svg-icon"></span> to access the Game Center.
    </p>
    </div>
    <div runat="server" id="Hint_2" visible="false">
    <p class="xxsl">
        Click on button <span class="svg-container"><img alt="Line-Up/Stats" border="0" src="../general/lineup-button.svg" class="svg-icon"></span> for Line-ups, <span class="svg-container"><img alt="Line-Up/Stats" border="0" src="../general/proc-button.svg" class="svg-icon"></span> for Stats and <span class="svg-container"><img alt="Shot by Shot" border="0" src="../general/shot-button.svg" class="svg-icon"></span> for Shot by Shot when available.
    </p>
    </div>
    <div runat="server" id="Hint_3" visible="false">
    <p class="xxsl">
        Click on button <span class="svg-container"><img alt="Line-Up/Stats" border="0" src="../general/lineup-button.svg" class="svg-icon"></span> for Line-ups.
    </p>
    </div>
</asp:Content>


