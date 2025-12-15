<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="GameCenter.aspx.cs" Inherits="CURLITEvent.aspnet.GameCenter" %>



<asp:Content ID="ContentStyle" ContentPlaceHolderID="HeaderStyleTop" runat="Server">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.7/signalr.min.js"></script>
    <script src="../Scripts/jquery-3.7.1.min.js"></script>
    <script src="../Scripts/livestones.js?v=1.3rc6"></script>
    <link href="../CSS/bootstrap.min.css" rel="stylesheet">
    <link href="../CSS/livescores.css?v=1.3alpha3c" rel="stylesheet" type="text/css" />
    <link href="../CSS/livestones.css?v=1.3alpha3c" rel="stylesheet" type="text/css" />
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

    <asp:HiddenField runat="server" ID="HiddenSeason" />
    <asp:HiddenField runat="server" ID="HiddenCompetition" />
    <asp:HiddenField runat="server" ID="HiddenEventID" />
    <asp:HiddenField runat="server" ID="HiddenSessionID" />
    <asp:HiddenField runat="server" ID="HiddenGameID" />

    <div id="scoreboard" class="container-wide tile-l">
        <div id="session-header" class="offline"></div>
        <!-- Running -->
        <div id="game-tile" class="row">
            <!-- Matchup Tile -->
            <div class="col-12">
                <div class="matchup-tile tile-l">
                    <header>
                        <div class="header-content">
                            <div class="select-wrapper" style="margin-left: 2px;">
                              <select title="sheet" name="sheet" class="sheet">
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </div>

                            <span class="left-text"></span>

                            <!-- Middle Text: "SCHEDULED" -->
                            <span class="middle-text"></span>

                            <!-- Right Text: "Gold Medal Game" and Buttons -->
                            <div class="d-flex justify-content-end align-items-center right-area">
                                <span class="me-1"></span>
                            </div>
                        </div>
                    </header>
                    <div class="dynamic-content">
                        <!-- For small screens -->
                        <div class="col-12">
                            <div class="d-flex justify-content-between">
                                <div class="summary">
                                    <div class="home">
                                        <img class="flag" src="">
                                        <span class="team-name"></span>
                                        <span class="score"></span>
                                        <span class="team-history"></span>
                                        <span class="team-clock"></span>
                                    </div>
                                    <span class="separator">-</span>
                                    <div class="away">
                                        <span class="score"></span>
                                        <span class="team-name"></span>
                                        <img class="flag" src="">
                                        <span class="team-history"></span>
                                        <span class="team-clock"></span>
                                    </div>
                                </div>
                            </div>


                            <table class="scoreboard game-center">
                                <thead>
                                </thead>
                                <tbody>
                                    <tr>
                                    </tr>
                                    <tr>
                                    </tr>
                                </tbody>
                            </table>


                            <!-- Game center -->
                            <div id="game-center">
                                <div id="top-stats">
                                    <div id="head-to-head">
                                        <div class="headers">
                                            <div class="headers-slider">
                                            </div>
                                        </div>
                                        <button type="button" class="header-arrow header-prev">&lt;</button>
                                        <button type="button" class="header-arrow header-next">&gt;</button>

                                        <div class="team-left"></div>
                                        <div class="team-right"></div>

                                        <div class="stats-container">
                                            <div class="stat-row-template" data-left="0" data-right="0">
                                                <div class="label"></div>
                                                <div class="label-left"></div>
                                                <div class="label-right"></div>
                                                <div class="text-line">
                                                    <div class="info-left"></div>
                                                    <div class="text-left"></div>
                                                    <div class="text-right"></div>
                                                    <div class="info-right"></div>
                                                </div>
                                                <div class="bar-line">
                                                    <div class="value-left"></div>
                                                    <div class="mirror-bar">
                                                        <div class="bar-left"></div>
                                                        <div class="bar-right"></div>
                                                    </div>
                                                    <div class="value-right"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="swipe-feedback left"></div>
                                        <div class="swipe-feedback right"></div>
                                        
                                        <div class="index-buttons" id="indexButtonsStats"></div>
                                    </div>
                                </div>



                                <!-- Game content -->
                                <div id="game-content">
                                    <div class="slider-wrapper">
                                        <div class="slider" id="slider"></div>

                                        <!-- arrows -->
                                        <button onclick="return false;" id="arrowPrev"
                                            class="nav-arrow left">
                                            &#10094;</button>
                                        <button onclick="return false;" id="arrowNext"
                                            class="nav-arrow right">
                                            &#10095;</button>

                                        <div class="index-buttons" id="indexButtons"></div>
                                    </div>

                                    <div id="currentShot">

                                        <div class="shotInfo">
                                            <!-- End/Stone -->
                                            <table class="endstone">
                                                <tr>
                                                    <td>
                                                        <div class="select-wrapper">
                                                            <select title="ends" name="ends" class="current-end"></select>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="select-wrapper" style="margin-left: 2px;">
                                                            <select title="stones" name="stones" class="current-stone"></select>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Competitor -->
                                            <table class="competitor">
                                                <tr>
                                                    <td class="flag" rowspan="2">
                                                        <img alt="" class="flag" src="">
                                                    </td>
                                                    <td>
                                                        <span class="lastname"></span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <span class="firstname"></span>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Shot details -->
                                            <table class="shot-details">
                                                <tr>
                                                    <td>
                                                        <span class="type"></span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <span class="handle"></span>
                                                        <span class="accuracy"></span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <span class="comment"></span>
                                                    </td>
                                                </tr>
                                            </table>



                                        </div>


                                        <!-- Action Buttons -->
                                        <div class="commands">
                                            <div class="command">
                                                <div class="col">Scoreboard</div>
                                                <div class="col">
                                                    <label class="switch">
                                                        <input type="checkbox" id="is_scb">
                                                        <span class="btn-slider round" data-target="scoreboard"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="command">
											  <div class="col">Stats</div>
											  <div class="col">
												<label class="switch">
												  <input type="checkbox" id="is_stats">
												  <span class="btn-slider round" data-target="stats"></span>
												</label>
											  </div>
											</div>
                                            <div class="command expand">
                                                <div class="col">Follow Live</div>
                                                <div class="col">
                                                    <label class="switch">
                                                        <input type="checkbox" checked id="is_live">
                                                        <span class="btn-slider round" data-target="live"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>


                        </div>


                    </div>
                </div>
            </div>
        </div>

        <p class="xxsl">
           Swipe left and right to select previous stones or different stats. Trial Version!
        </p>
</asp:Content>

