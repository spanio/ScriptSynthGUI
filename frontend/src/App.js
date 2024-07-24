import React, { useState, useEffect } from 'react';
import axios from 'axios';
import yaml from 'js-yaml';
import './App.css'; // Import the CSS file

function App() {
  const [testName, setTestName] = useState('');
  const [samplingFrequency, setSamplingFrequency] = useState('');
  const [metadata, setMetadata] = useState('');
  const [outputOptions, setOutputOptions] = useState({
    csv: false,
    chronos: false,
    influxdb: false,
  });
  const [influxConfig, setInfluxConfig] = useState({
    host: '',
    port: '',
    database: '',
    bucket: '',
    user: '',
    password: ''
  });
  const [hardware, setHardware] = useState([]);
  const [commands, setCommands] = useState([]);
  const [yamlPreview, setYamlPreview] = useState('');

  useEffect(() => {
    generateYamlPreview();
  }, [testName, samplingFrequency, metadata, outputOptions, influxConfig, hardware, commands]);

  const handleAddHardware = (type) => {
    const newHardware = { type, channels: {} };
    if (type === 'STRIDE') {
      newHardware.host = '';
      newHardware.units = '';
      newHardware.input_type = '';
    } else if (type === 'NIDAQ') {
      newHardware.hw_type = ''; // Avoid conflict with 'type'
      newHardware.interface = '';
      newHardware.device = '';
      newHardware.terminal_config = 'RSE';
      newHardware.acquisition_type = 'FINITE';
      newHardware.sampling_freq = '5000';
      newHardware.buffer_size = '20000';
      newHardware.cage_position = '';
    } else if (type === 'SPANUARTClient') {
      newHardware.module_type = '';
      newHardware.module_position = '';
      newHardware.port = '';
      newHardware.baud = '115200';
      newHardware.read_timeout_s = '0.25';
      newHardware.version = '';
      newHardware.cmd_delay_ms = '100';
    } else if (type === 'ADAM') {
      newHardware.hw_type = 'Data Acquisition Module';
      newHardware.host = '';
      newHardware.input_type = '';
    }
    setHardware([...hardware, newHardware]);
  };

  const handleDeleteHardware = (index) => {
    const newHardware = hardware.filter((_, i) => i !== index);
    setHardware(newHardware);
  };

  const handleAddChannel = (index) => {
    const newHardware = [...hardware];
    const channelCount = Object.keys(newHardware[index].channels).length;
    newHardware[index].channels[`Channel ${channelCount}`] = '';
    setHardware(newHardware);
  };

  const handleChangeHardware = (index, field, value) => {
    const newHardware = [...hardware];
    newHardware[index][field] = value;
    setHardware(newHardware);
  };

  const handleChangeChannel = (hIndex, cIndex, value) => {
    const newHardware = [...hardware];
    newHardware[hIndex].channels[cIndex] = value;
    setHardware(newHardware);
  };

  const handleAddCommand = () => {
    setCommands([...commands, { time: '', port: '', baud: '', command: '' }]);
  };

  const handleChangeCommand = (index, field, value) => {
    const newCommands = [...commands];
    newCommands[index][field] = value;
    setCommands(newCommands);
  };

  const handleOutputOptionChange = (option) => {
    setOutputOptions({ ...outputOptions, [option]: !outputOptions[option] });
  };

  const handleSaveYaml = async () => {
    const output = {};
    if (outputOptions.csv) output.CSV = {};
    if (outputOptions.chronos) output.Chronos = {};
    if (outputOptions.influxdb) {
      output.InfluxDB = {
        host: influxConfig.host,
        port: influxConfig.port,
        database: influxConfig.database,
        bucket: influxConfig.bucket,
        user: influxConfig.user,
        password: influxConfig.password,
      };
    }

    const config = {
      test_name: testName,
      sampling_frequency: samplingFrequency,
      metadata: metadata,
      output: output,
      hardware: hardware.map(hw => {
        const { type, channels, ...rest } = hw;
        return { name: type, channels, ...rest };
      }),
      commands: commands
    };

    try {
      await axios.post('http://localhost:5000/generate-config', config);
      const link = document.createElement('a');
      link.href = 'http://localhost:5000/download-config';
      link.setAttribute('download', 'config.yaml');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('There was an error generating the config!', error);
    }
  };

  const generateYamlPreview = () => {
    const output = {};
    if (outputOptions.csv) output.CSV = {};
    if (outputOptions.chronos) output.Chronos = {};
    if (outputOptions.influxdb) {
      output.InfluxDB = {
        host: influxConfig.host,
        port: influxConfig.port,
        database: influxConfig.database,
        bucket: influxConfig.bucket,
        user: influxConfig.user,
        password: influxConfig.password,
      };
    }

    const config = {
      test_name: testName,
      sampling_frequency: samplingFrequency,
      metadata: metadata,
      output: output,
      hardware: hardware.map(hw => {
        const { type, channels, ...rest } = hw;
        return { name: type, channels, ...rest };
      }),
      commands: commands
    };

    setYamlPreview(yaml.dump(config, { indent: 2 }));
  };

  return (
    <div className="container">
      <div className="left-panel">
        <h1>ScriptSynth Configuration (is updated)</h1>
        <div>
          <label>Test Name:</label>
          <input type="text" value={testName} onChange={e => setTestName(e.target.value)} /><br />
          <label>Sampling Frequency (Hz):</label>
          <input type="text" value={samplingFrequency} onChange={e => setSamplingFrequency(e.target.value)} /><br />
          <label>Metadata:</label>
          <input type="text" value={metadata} onChange={e => setMetadata(e.target.value)} /><br />
        </div>
        <div>
          <h2>Output</h2>
          <label>
            <input
              type="checkbox"
              checked={outputOptions.csv}
              onChange={() => handleOutputOptionChange('csv')}
            />
            CSV
          </label><br />
          <label>
            <input
              type="checkbox"
              checked={outputOptions.chronos}
              onChange={() => handleOutputOptionChange('chronos')}
            />
            Chronos
          </label><br />
          <label>
            <input
              type="checkbox"
              checked={outputOptions.influxdb}
              onChange={() => handleOutputOptionChange('influxdb')}
            />
            InfluxDB
          </label><br />
          {outputOptions.influxdb && (
            <div>
              <label>InfluxDB Host:</label>
              <input type="text" value={influxConfig.host} onChange={e => setInfluxConfig({ ...influxConfig, host: e.target.value })} /><br />
              <label>InfluxDB Port:</label>
              <input type="text" value={influxConfig.port} onChange={e => setInfluxConfig({ ...influxConfig, port: e.target.value })} /><br />
              <label>InfluxDB Database:</label>
              <input type="text" value={influxConfig.database} onChange={e => setInfluxConfig({ ...influxConfig, database: e.target.value })} /><br />
              <label>InfluxDB Bucket:</label>
              <input type="text" value={influxConfig.bucket} onChange={e => setInfluxConfig({ ...influxConfig, bucket: e.target.value })} /><br />
              <label>InfluxDB User:</label>
              <input type="text" value={influxConfig.user} onChange={e => setInfluxConfig({ ...influxConfig, user: e.target.value })} /><br />
              <label>InfluxDB Password:</label>
              <input type="password" value={influxConfig.password} onChange={e => setInfluxConfig({ ...influxConfig, password: e.target.value })} /><br />
            </div>
          )}
        </div>
        <div className="hardware-section">
          <h2>Hardware</h2>
          <button type="button" onClick={() => handleAddHardware('STRIDE')}>Add STRIDE</button>
          <button type="button" onClick={() => handleAddHardware('NIDAQ')}>Add NIDAQ</button>
          <button type="button" onClick={() => handleAddHardware('SPANUARTClient')}>Add SPANUARTClient</button>
          <button type="button" onClick={() => handleAddHardware('ADAM')}>Add ADAM</button>
          {hardware.map((hw, index) => (
            <div key={index} className="hardware-item">
              <div className="hardware-item-header">
                <h3>{hw.type} Hardware {index + 1}</h3>
                <button type="button" onClick={() => handleDeleteHardware(index)}>Delete</button>
              </div>
              {hw.type === 'STRIDE' && (
                <>
                  <label>Host:</label>
                  <input type="text" value={hw.host} onChange={e => handleChangeHardware(index, 'host', e.target.value)} /><br />
                  <label>Units:</label>
                  <input type="text" value={hw.units} onChange={e => handleChangeHardware(index, 'units', e.target.value)} /><br />
                  <label>Input Type:</label>
                  <input type="text" value={hw.input_type} onChange={e => handleChangeHardware(index, 'input_type', e.target.value)} /><br />
                </>
              )}
              {hw.type === 'NIDAQ' && (
                <>
                  <label>Type:</label>
                  <input type="text" value={hw.hw_type} onChange={e => handleChangeHardware(index, 'hw_type', e.target.value)} /><br />
                  <label>Interface:</label>
                  <input type="text" value={hw.interface} onChange={e => handleChangeHardware(index, 'interface', e.target.value)} /><br />
                  <label>Device:</label>
                  <input type="text" value={hw.device} onChange={e => handleChangeHardware(index, 'device', e.target.value)} /><br />
                  <label>Terminal Config:</label>
                  <input type="text" value={hw.terminal_config} onChange={e => handleChangeHardware(index, 'terminal_config', e.target.value)} /><br />
                  <label>Acquisition Type:</label>
                  <input type="text" value={hw.acquisition_type} onChange={e => handleChangeHardware(index, 'acquisition_type', e.target.value)} /><br />
                  <label>Sampling Frequency:</label>
                  <input type="text" value={hw.sampling_freq} onChange={e => handleChangeHardware(index, 'sampling_freq', e.target.value)} /><br />
                  <label>Buffer Size:</label>
                  <input type="text" value={hw.buffer_size} onChange={e => handleChangeHardware(index, 'buffer_size', e.target.value)} /><br />
                  <label>Cage Position:</label>
                  <input type="text" value={hw.cage_position} onChange={e => handleChangeHardware(index, 'cage_position', e.target.value)} /><br />
                </>
              )}
              {hw.type === 'SPANUARTClient' && (
                <>
                  <label>Module Type:</label>
                  <input type="text" value={hw.module_type} onChange={e => handleChangeHardware(index, 'module_type', e.target.value)} /><br />
                  <label>Module Position:</label>
                  <input type="text" value={hw.module_position} onChange={e => handleChangeHardware(index, 'module_position', e.target.value)} /><br />
                  <label>Port:</label>
                  <input type="text" value={hw.port} onChange={e => handleChangeHardware(index, 'port', e.target.value)} /><br />
                  <label>Baud:</label>
                  <input type="text" value={hw.baud} onChange={e => handleChangeHardware(index, 'baud', e.target.value)} /><br />
                  <label>Read Timeout (s):</label>
                  <input type="text" value={hw.read_timeout_s} onChange={e => handleChangeHardware(index, 'read_timeout_s', e.target.value)} /><br />
                  <label>Version:</label>
                  <input type="text" value={hw.version} onChange={e => handleChangeHardware(index, 'version', e.target.value)} /><br />
                  <label>Command Delay (ms):</label>
                  <input type="text" value={hw.cmd_delay_ms} onChange={e => handleChangeHardware(index, 'cmd_delay_ms', e.target.value)} /><br />
                </>
              )}
              {hw.type === 'ADAM' && (
                <>
                  <label>Type:</label>
                  <input type="text" value={hw.hw_type} onChange={e => handleChangeHardware(index, 'hw_type', e.target.value)} /><br />
                  <label>Host:</label>
                  <input type="text" value={hw.host} onChange={e => handleChangeHardware(index, 'host', e.target.value)} /><br />
                  <label>Input Type:</label>
                  <input type="text" value={hw.input_type} onChange={e => handleChangeHardware(index, 'input_type', e.target.value)} /><br />
                </>
              )}
              <label>Channels:</label>
              <button type="button" onClick={() => handleAddChannel(index)}>Add Channel</button>
              {Object.keys(hw.channels).map((channel, cIndex) => (
                <div key={cIndex}>
                  <label>{channel}:</label>
                  <input type="text" value={hw.channels[channel]} onChange={e => handleChangeChannel(index, channel, e.target.value)} /><br />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="commands-section">
          <h2>Commands</h2>
          <button type="button" onClick={handleAddCommand}>Add Command</button>
          {commands.map((cmd, index) => (
            <div key={index} className="command-item">
              <label>Time (hh:mm:ss):</label>
              <input type="text" value={cmd.time} onChange={e => handleChangeCommand(index, 'time', e.target.value)} /><br />
              <label>Port:</label>
              <input type="text" value={cmd.port} onChange={e => handleChangeCommand(index, 'port', e.target.value)} /><br />
              <label>Baud Rate:</label>
              <input type="text" value={cmd.baud} onChange={e => handleChangeCommand(index, 'baud', e.target.value)} /><br />
              <label>Command:</label>
              <input type="text" value={cmd.command} onChange={e => handleChangeCommand(index, 'command', e.target.value)} /><br />
            </div>
          ))}
        </div>
      </div>
      <div className="right-panel">
        <button type="button" onClick={handleSaveYaml}>Save YAML</button>
        <h2>YAML Preview</h2>
        <pre>{yamlPreview}</pre>
      </div>
    </div>
  );
}

export default App;
