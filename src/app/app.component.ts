import { AfterViewInit, Component } from '@angular/core';
import { Firestore, collection, query, onSnapshot, orderBy, QueryDocumentSnapshot, DocumentData, collectionData } from '@angular/fire/firestore';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { LeafletMap } from '@sersol/ngx-leaflet';
import { circleMarker, geoJSON, LayerGroup } from 'leaflet';
import { formatDate } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'adminsat-terceros';
  item$: Observable<any[]> | undefined;
  private leafletInstance!: LeafletMap;
  private layerGroup = new LayerGroup();
  modelForm = this._fb.group({

  });

  constructor(private _fs: Firestore, private _fb: FormBuilder) {
  }

  ngAfterViewInit() {
    /* const collectionn = collection(this._fs, 'adminsat');
    this.item$ = collectionData(collectionn);

    this.item$.pipe().subscribe(x => console.log(x)); */

    this.getAll();

    this.leafletInstance = new LeafletMap({
      container: 'map'
    });

    this.leafletInstance.map.setView([4.6288702, -74.1193724], 11);

    this.layerGroup.addTo(this.leafletInstance.map);

  }

  updateMap(docs: DocumentData[]) {

    this.layerGroup.clearLayers();

    var FeatureCollection: any = {
      type: 'FeatureCollection',
      features: [] as any[]
    }

    docs.forEach(x => {
      // console.log(x);

      const data = x;

      FeatureCollection.features.push({
        type: 'Feature',
        properties: {
          bgColor: data['gps'] === 1 ? 'green' : 'red',
          tooltip: `<div>Bateria: <strong>${data['battery']}</strong></div>
                    <div>Fecha: <strong>${formatDate(new Date(data['time_millis']), 'medium', 'en')}</strong></div>`
        },
        geometry: {
          "type": "Point",
          "coordinates": [data['lon'], data['lat']]
        }
      });

    });

    const geojson = geoJSON(FeatureCollection, {
      pointToLayer: function (feature, latlng) {
        return circleMarker(latlng, {
          fillColor: feature.properties.bgColor,
          color: '#000',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.5
        });
      },
      onEachFeature: function (feature, layer) {

        layer.bindTooltip(`<div class="details">${feature.properties.tooltip}</div>`);

      }
    });

    this.layerGroup.addLayer(geojson);

    // this.leafletInstance.map.fitBounds(geojson.getBounds());
  }

  getAll() {

    collectionData(
      query(
        collection(this._fs, "adminsat"),
        orderBy('time_millis', 'desc')
      )
    )
    .subscribe(x => this.updateMap(x));
  }


}
