import json
from datetime import date
from rir_dashboard.views.dashboard._base import BaseDashboardView
from rir_data.serializer.scenario import ScenarioLevelSerializer
from rir_data.serializer.context_layer import ContextLayerSerializer


class ContextAnalysisView(BaseDashboardView):
    template_name = 'dashboard/context-analysis.html'

    @property
    def dashboard_title(self):
        return 'Dashboard'

    @property
    def context_view(self) -> dict:
        """
        Return context for specific view by instance
        """
        context = {}
        context['scenarios'] = ScenarioLevelSerializer(
            self.instance.scenario_levels, many=True
        ).data

        indicators, overall_scenario_level = self.instance.get_indicators_and_overall_scenario

        # intervention
        interventions = []
        for program_instance in self.instance.programs_instance:
            intervention = program_instance.programintervention_set.filter(
                scenario_level__level=overall_scenario_level).first()
            if intervention:
                interventions.append(intervention)
        try:
            context['overall_scenario'] = context['scenarios'][overall_scenario_level - 1]
        except IndexError:
            context['overall_scenario'] = 1
        context['indicators'] = indicators
        context['interventions'] = interventions
        context['today_date'] = date.today().strftime('%Y-%m-%d')
        context['context_layers'] = json.loads(
            json.dumps(ContextLayerSerializer(self.instance.context_layers, many=True).data)
        )

        country_level = self.instance.geometry_levels.filter(parent=None).first()
        if country_level:
            country_level = country_level.level
            geometry_country = self.instance.geometries().filter(
                geometry_level=country_level).first()
            if geometry_country:
                context['country_geometry'] = json.loads(
                    geometry_country.geometry.geojson
                )
        return context
