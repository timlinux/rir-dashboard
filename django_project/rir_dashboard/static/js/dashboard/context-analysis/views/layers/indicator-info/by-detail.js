/**
 * Layers of map controlled in here.
 * Add layers in here.
 */
define(['js/views/layers/indicator-info/base'], function (Base) {
    return Base.extend({
        /** Initialization
         */
        panelID: 'indicator-geometry-detail',
        /**
         * Init listener for layers
         */
        listener: function () {
            event.register(this, evt.GEOMETRY_CLICKED, this.geometryClicked);
            event.register(this, evt.DATE_CHANGED, this.dateChanged);
            event.register(this, evt.INDICATOR_TO_DETAIL, this.indicatorSelected);
        },
        changed: function () {
            const self = this;
            if (this.opened && this.geometry && this.date && this.indicatorID) {
                const self = this;
                this.$el.find('tr').hide();
                this.$el.find('.indicator-info-content .graph').html('');
                this.$el.find('.indicator-info-content .value-table').html('');
                this.$el.find('.indicator-info-title .col').html(
                    `${this.indicatorName} <span style="color: gray">in</span> ${this.geometry.properties.geometry_name} (${this.geometry.properties.geometry_code})`
                );
                this.control.detailPanelOpened(this.panelID);
                const url = urls['indicator-values-by-geometry-and-level-api'].replaceAll(
                    '/0/', `/${this.indicatorID}/`).replaceAll(
                    'geometry_identifier', this.geometry.properties.geometry_code).replaceAll(
                    'geometry_level', this.geometry.properties.geometry_level).replaceAll(
                    'date', this.date);
                if (this.request) {
                    this.request.abort();
                }
                this.request = Request.get(
                    url, {}, {},
                    function (values) {
                        const data = [];
                        self.dataByTime = {};
                        $.each(values, function (idx, value) {
                            data.push({
                                x: new Date(value.date).getTime(),
                                y: value.value,
                                color: value.background_color,
                                scenario_value: value.scenario_value,
                            });
                            self.dataByTime[new Date(value.date).getTime()] = value;
                        });
                        self.propertiesSelected(new Date(self.date).getTime());
                        const title = '';
                        const options = {
                            chart: {
                                zoomType: 'x',
                                height: 200,
                            },
                            title: {
                                text: title,
                                enabled: false
                            }, yAxis: {
                                labels: {
                                    formatter: function () {
                                        return '';
                                    }
                                }
                            },
                            xAxis: {
                                type: 'datetime',
                                title: {
                                    text: ''
                                },
                                labels: {
                                    format: '{%Y-%b-%e}'
                                },
                            },
                            legend: {
                                enabled: true
                            },
                            rangeSelector: {
                                selected: 0,
                                inputEnabled: false,
                                enabled: false
                            },
                            plotOptions: {
                                series: {
                                    showInLegend: false
                                }
                            },
                            scrollbar: { enabled: false },
                            navigator: { enabled: false },
                            tooltip: {
                                formatter: function () {
                                    self.propertiesSelected(this.x);
                                    return '<b>' + Highcharts.numberFormat(this.y, 0) + `</b> (${indicatorRules[self.indicatorID][this.y]?.name})` + '<br/>' + dateToYYYYMMDD(new Date(this.x));
                                }
                            },
                            series: [
                                {
                                    type: 'line',
                                    name: title,
                                    data: data,
                                    lineWidth: 1,
                                    states: {
                                        hover: {
                                            lineWidth: 1
                                        }
                                    },
                                    tooltip: {
                                        formatter: function () {
                                            console.log('test')
                                            return 'test'
                                        }
                                    },
                                    marker: {
                                        enabled: true
                                    }
                                }
                            ]
                        };
                        self.chart = Highcharts.stockChart(`indicator-geometry-detail-graph`, options);
                    }, function (e) {
                        console.log(e)
                    })
            }
        },
        propertiesSelected: function (timestamp) {
            if (!this.dataByTime) {
                return
            }
            const properties = this.dataByTime[timestamp] ? this.dataByTime[timestamp] : this.dataByTime[Object.keys(this.dataByTime)[0]];
            let defaultHtml =
                `<tr style="background-color: ${properties.background_color}; color: ${properties.text_color}"><td colspan="2" style="text-align: center"><b>${this.indicatorName}</b></td></tr>` +
                `<tr><td valign="top"><b>Scenario</b></td valign="top"><td>${properties.scenario_text}</td></tr>` +
                `<tr><td><b>Indicator value</b></td><td valign="top">${properties.value}</td valign="top"></tr>`

            // check others properties
            $.each(properties, function (key, value) {
                if (!['value', 'background_color', 'text_color', 'scenario_text', 'scenario_value', 'geometry_id', 'indicator_id', 'geometry_level'].includes(key)) {
                    defaultHtml += `<tr><td valign="top"><b>${key.capitalize()}</b></td><td valign="top">${numberWithCommas(value)}</td></tr>`
                }
            });
            this.$el.find('.value-table').html(`<table>${defaultHtml}</table>`);
        },
        /**
         * When geometry clicked
         */
        geometryClicked: function (geometry) {
            this.geometry = geometry;
            this.changed();
        },
        /**
         * When geometry clicked
         */
        dateChanged: function (date) {
            this.date = date;
            this.changed();
        },
        /**
         * When geometry clicked
         */
        indicatorSelected: function (indicatorID, indicatorName) {
            this.indicatorID = indicatorID;
            this.indicatorName = indicatorName;
            this.opened = true;
            this.changed();
        },
        /**
         * Open the panel
         */
        open: function () {
            Base.prototype.open.apply(this);
            this.opened = true;
        },
        /**
         * Open the panel
         */
        close: function () {
            Base.prototype.close.apply(this);
        },
    })
});