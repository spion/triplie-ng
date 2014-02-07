# INTRODUCTION


Triplie is an AI bot based on 2nd up to 5th order Markov model. It uses an
SQLite database for storage.

Triplie learns by creating

1. a dictionary of words
2. a graph representing valid 5-grams (consecutive groups of 5 words)
   encountered in the text
3. a graph of associations between words from sentences formed according to the
   Hebbian rule

To respond to a user, triplie extracts keywords from the user's text, finds
their most appropriate associated keywords in the Hebbian association network,
and generates replies that contain the associated keywords using multiple
breadth-first-search Markov chains algorithm.

For more information on installing and configuring read below

You can join the project's IRC channel too:
[#triplie on irc.freenode.net](irc://irc.freenode.net/#triplie)


# Install

## Prerequisites

Download and install [node.js](http://nodejs.org/) for your system.
Its recommended to build node from source. If you don't do that, make
sure that npm is also installed alongside with node and that the
node binary is called "node"

Then from a terminal run:

    npm install -g triplie


This will install the `triplie` command on your system.

Configure the bot as explained below before running!

# CONFIGURATION

If running the bot for the first time and its not configured,
you should create a new directory and run:

    triplie config.yaml --init

to create the initial config file

### Edit config.yaml

config.yaml is already pre-filled with some default for your bot. You will want
to change some of these settings.

The configuration file is really well commented. Open it and edit it according
to the instructions contained inside. Once you run the bot however, the
instructions will disappear the moment you change a setting by giving a command
to the bot.

# RUNNING

After you edited the config file, to run the bot use the command:

    triplie config.yaml

# IMPORT EXISTING TEXT

If called with the argument `--feed` triplie will receive data from stdin,
parse it using a regular expression then feed the database.

Example:

    cat log.txt | triplie config.yaml --feed --regex '(?<year>\d+)-(?<month>\d+)-(?<day>)T(?<hour>\d+):(?<minute>\d+):(?<second>\d+)Z\s+(?<nick>.+):\s+(?<text>.+)'

will work for a `log.txt` that has lines in the format:

    2013-04-04T13:15:00Z someuser: I wrote some text

The syntax is XRegExp and uses named groups. See
[the XRegExp readme](https://npmjs.org/package/xregexp) for more info

Currently, supported named captures are:

* year
* month
* day
* hour
* minute
* second
* timestamp - unix timestamp in seconds, used instead of the date captures
* timestampms - unix timestamp in miliseconds, used instead of both above.
* text - the text content

Timestamp example:

    cat log.txt | triplie config.yaml --feed --regex '(?<timestamp>\d+) (?<text>.+)

will match `log.txt` containing lines in the format:

    1234567890 example text here

All captures except text are optional - the time is optional and if left out
the feeder will generate reasonable "fake" timestamps.

    cat log.txt | triplie config.yaml --feed --regex '(?<text>.+)'


# COMMANDS

List of triplie's commands (assuming "!" is the cmdchar)

1. !join #channel - causes the bot to join and remember the channel

2. !part #channel - part and forget channel

3. !reload - causes reload of the bot code, useful for development

4. !set path value - set a config setting to the specified value. Examples

       !set ai.sleep.1 10 - Set the upper sleep limit to 10 seconds
       !set ai.sleep [2,3] - Set both sleep limits. Value musn't contain space.

5. !get path - get the config value at the specified path

6. !db stats - triplie will output database statistics

!cmd will return results via private notice

!!cmd returns results via public message

# LICENCE & AUTHOR

See LICENCE and AUTHORS (if present)

![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/spion/triplie-ng/trend.png)

