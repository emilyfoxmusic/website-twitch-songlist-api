const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');
const { v4: uuidv4 } = require('uuid');
const { broadcast } = require('../helpers/broadcast');
const Validation = require('../helpers/validation');

const songListTableName = process.env.songListTableName;

exports.handler = async (event) => {
  console.info('List add request received', event);
  const body = JSON.parse(event.body);

  if (!Validation.isRequiredString(body.title)) {
    return Responses._400({ message: 'Invalid title' });
  }

  if (!Validation.isRequiredString(body.artist)) {
    return Responses._400({ message: 'Invalid artist' });
  }

  const matchedSongs = await Dynamo.search(
    '(Artist = :artist) and (Title = :title)',
    { ':artist': body.artist, ':title': body.title },
    songListTableName
  );
  console.debug('Matched songs', matchedSongs);
  if (matchedSongs.length > 0) {
    console.debug('Matched songs', matchedSongs);
    return Responses._400({ message: 'Song already exists' });
  }

  const newDynamoEntry = {
    ID: uuidv4(),
    Title: body.title,
    Artist: body.artist,
    NumberOfPlays: 0,
  };
  console.debug('Writing song entry', newDynamoEntry);
  await Dynamo.write(newDynamoEntry, songListTableName);

  const songData = {
    id: newDynamoEntry.ID,
    title: newDynamoEntry.Title,
    artist: newDynamoEntry.Artist,
    numberOfPlays: newDynamoEntry.NumberOfPlays,
  };
  console.debug('Song added', songData);

  await broadcast({
    action: 'listAdd',
    data: songData,
  });
  return Responses._200(songData);
};
