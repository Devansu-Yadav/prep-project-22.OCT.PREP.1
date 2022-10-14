import { useEffect, useState } from "react";
import './App.css';
import logo from './mlh-prep.png'

import ItemsNeeded from "./Components/ItemsNeeded";
import MapBox from "./Components/Map/MapBox";
import { ReactSearchAutocomplete } from 'react-search-autocomplete';


// A timer to help while clearing setTimeout 
// inside `debouncedSuggestLocations` function.
let timerForSuggestedLocations;

function App() {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [city, setCity] = useState("New York City")
  const [results, setResults] = useState(null);
  const [suggestedLocation, setSuggestedLocation] = useState([]);
  const [coordinates, setCoordinates] = useState({
    lat: 40.7143,
    lon: -74.006
  });
  const [weatherType, setWeatherType] = useState("")


  const findUserLocation = (position) => {
    const latitude = position.coords.latitude, longitude = position.coords.longitude;
    fetch("https://api.openweathermap.org/geo/1.0/reverse?lat="+latitude+"&lon="+longitude+"&limit=5&appid=" + process.env.REACT_APP_APIKEY)
    .then(res => res.json())
    .then(
      (result) => {
        console.log(result);
          setCity(result[0].name);
        }
    )
  }

  const suggestLocations = () => {
    if(!city) return setSuggestedLocation([]);

    fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${city}&apiKey=${process.env.REACT_APP_AUTOCOMPLETE_LOCATION_APIKEY}`
    )
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        const ci = [];
        res.features.forEach((feature) => {
          ci.push(<div>
            {feature.properties.formatted}
          </div>
            );
        });
        setSuggestedLocation(ci);
        
    });
  };

  const debouncedSuggestLocations = () => {
    clearTimeout(timerForSuggestedLocations);

    timerForSuggestedLocations = setTimeout(() => {
      suggestLocations();
    }, 500);
  };
  
  useEffect(() => {
    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition(findUserLocation);
    }
    else{
      alert("Geolocation is not supported by this browser.");
    }
  }, [])

  useEffect(() => {
    debouncedSuggestLocations();

    fetch("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=metric&appid=" + process.env.REACT_APP_APIKEY)
      .then(res => res.json())
      .then(
        (result) => {
          if (result['cod'] !== 200) {
            setIsLoaded(false)
          } else {
            setIsLoaded(true);
            console.log(result)
            setResults(result);
            setCoordinates(result.coord);
            setWeatherType(result.weather[0].main);
          }
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
          setWeatherType(error);
        })
      }, [city])

  const weather = (weatherType) => {
    switch (weatherType) {
      case "Clouds":
        return "cloudy"
      case "Clear":
        return "clear"
      case "Rain":
        return "rainy"
      case "Snow":
        return "snowy"
      case "Thunderstorm":
        return "stormy"
      case "Drizzle":
        return "drizzly"
      default:
        return "haze"
    }
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  } else {
    return <div className={"main " + weather(weatherType)}>
      <img className="logo" src={logo} alt="MLH Prep Logo"></img>
      <div>
        <h2>Enter a city below 👇 or Click on a location in 🗺</h2>
        <input
          type="text"
          value={city}
          onChange={event => setCity(event.target.value)} />
          <div className="drop-down-menu">
            {/* <select> */}
            {/* {suggestedLocation} */}

        {/* {suggestedLocation.map((d, index) => (<option key = {index} value={d}>{d}</option>))}  */}
        {suggestedLocation.map((d, index) => (<p>{index}{d}</p>))} 
            {/* </select> */}
                
          </div>        
          
          <MapBox 
          coordinates={coordinates} 
          setCoordinates={setCoordinates} 
          setResults={setResults}
          setError={setError}
          setCity={setCity}
         />
        <div className="Results">
          {!isLoaded && <h2>Loading...</h2>}
          {isLoaded && results && <>
            <h3>{results.weather[0].main}</h3>
            <p>Feels like {results.main.feels_like}°C</p>
            <i><p>{results.name}, {results.sys.country}</p></i>
            <ItemsNeeded weatherKind={results.weather[0].main}/>
          </>}
        </div>
      </div>
    </div>
  }
}

export default App;
