# INTRODUCTION


Triplie is an AI bot based on 2nd up to 5th order Markov model. It uses an SQLite database for storage.

Triplie learns by creating

1. a dictionary of words 
2. a graph representing valid 5-grams (consecutive groups of 5 words) encountered in the text
3. a graph of associations between words from sentences formed according to the Hebbian rule

To respond to a user, triplie extracts keywords from the user's text, finds their most appropriate 
associated keywords in the Hebbian association network, and generates replies that contain the 
associated keywords using multiple breadth-first-search Markov chains algorithm.

For more information on installing and configuring read below

You can join the project's IRC channel too: #triplie on irc.freenode.net


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

   triplie config.json --init

to create the initial config file

### Edit config.json

config.json is already pre-filled with some default for your bot. 
However, you will probably want to change some of these settings.

The ones that you will probably want to change are highlighted

* db - Path to the database file relative to the config file, e.g. `"db":"triplie.db". 
  
  You can also specify `"db":":memory:"` to use an in-RAM database, but the data will be 
  lost if triplie is shut down or crashes
  
* **server** - IP or hostname of the IRC server, e.g. `"server":"irc.freenode.net"`
* port - port of the IRC server, e.g. `"port":6667`

* modules - a list of modules to load. Its recommended to keep it intact.
  * "triplie" - the core module, don't remove it
  * "admin" - administrator commands - reload, join, part
  * "read" - commands to read all text on a link

* **channels** - a list of channels to join. Example: `"channels":["#first", "#second"]`
* cmdchar - prefix character for the commands

* **admins** - list of regular expressions to determine admins from their nick!user@host
  string.

  Choose your admin hosts carefully. On Undernet I recommend using 

      [".+@youruser.users.undernet.org"]
    
  for better security. On freenode the unaffiliated/affiliated hostmasks are a
  good choice. At the end it should look something like this:

      [
        ".+@myxuser.users.undernet.org",
        ".+@unaffiliated/adminnickname",
        ".+myident@myvhost.myisp.com"
      ]

* **info** - personal info of the bot
  * **nick** - IRC nickname
  * user - IRC (machine) username to show (if identd is not installed on your machine)
  * name - IRC name

* ai - contains AI configuration options

  * associations - configure the Hebbian association network

    * halflife (time in days)

      The association will lose half of its value `halflife` days after it is last 
      encountered in a sentence. Making this value lower will make the bot focus
      on recent events, while making it longer will cause it to recall older things
      more frequently

    * limit (number) - Only take the best N associations for every sentence. Making
      this value larger will cause the bot to explore broader context, while mamking
      it smaller will cause it to be more focused.

  * similars - how the AI determines similar words

    * algorithm - One of `"porter"`, `"levenshtein"` or `"none"`

      What algorithm to use to determine similar words. The `"porter"` stemmer is 
      recommended for English. Don't use `"levenshtein"` as its presently extremely 
      slow - for unsupported languages its better to use `"none"`
 
    * **language** - Stemmer language, one of `"en"` (english), `"ru"` (russian) or `"es"` (spanish)

    * percent (number) - Maximum percentage difference for the levenshtein algorithm.

  * keywords - control how keywords are picked

    * treshold (number) 

      Determines how many times less frequent should a word be than the most 
      frequent word in order for triplie to consider it "interesting". Helps
      remove stop-words from the input text such as "a", "of", "and" etc.

    * limit (number)

      Consider at most this many associated keywords when trying to form the reply.
      The best associated keywords are picked. Increasing this too much will cause 
      triplie to say more irrelevant things, decreasing it too much will cause it 
      to only say obvious things (at least in theory)

  * generalization - number between 1-100. Controls triplie's tendency for 
    generalization. In theory, making this number closer to 100 will cause 
    triplie to pick more general, typical topics while lowering it will cause it 
    to pick less typical topics. Best left at 50

  * creativity - number between 1-100. Controls creative use of language. 
    If increased to 100, triplie will often use words in contexts where they
    were never used before. When reduced, triplie will be more cautious when
    recognizing patterns. Setting it to 0 will cause triplie to never recognize 
    patterns of word usage. For example, if triplie notices that the words "dog" 
    and "cat" are used in "many" common n-grams it may use the n-grams of "dog" in 
    addition to the n-grams of "cat" when forming a sentence that needs to contain 
    the keyword "cat" `creativity` determines how many is "many"

  * n-gram - controls markov chains engine

    * length - the length of the chains to use. Longer length results with more
      coherent sentences. Shorter length results with more sentences when
      there is less training data. Must be <= 5. Recommended value 4.
    
    * depth - when the algorithm is searching for the next keyword, limit the
      search depth in the n-gram graph to this number. Increasing this number
      results with exponential increase in the memory and time needed. Besides,
      too big values will result in low keyword density - the number of words
      between two keywords can go up to `depth`
  
  * sleep - array of two numbers `[n1, n2]` e.g. `[3, 5]`. Causes the bot to sleep 
    between n1 and n2 seconds before answering. Makes it look more human.

  * answer - controls answer length

    * minwords - minimum number of words to use when forming a sentence

    * minkeys - minimum number of keywords in the formed sentence.

  * partake - control unsolicited reply (reply to channel message even when bot 
    nickname is not in the message). 

    * probabiliy - 0 to 100. 0 is no replies. 

    * traffic - the highest amount of total channel messages during the past 
      minute that allow an unsolicited reply. 0 is no limit.


# IMPORT EXISTING TEXT

If called with the argument `--feed` triplie will receive data from stdin, parse it
using a regular expression then feed the database.

Example:

    cat log.txt | triplie config.json --feed --regex '(?<year>\d+)-(?<month>\d+)-(?<day>)T(?<hour>\d+):(?<minute>\d+):(?<second>\d+) (?<nick>): \s+ (?<text>) \s+'

The syntax is XRegExp and uses named groups. See [the XRegExp readme](https://npmjs.org/package/xregexp) for more info

Currently, supported named captures are:

* year
* month
* day
* hour 
* minute
* second
* timestamp - unix timestamp in seconds, can be used instead of the date captures
* timestampms - unix timestamp in miliseconds, can be used instead of both above.
* text - the text content

All captures except text are optional.


# COMMANDS

List of triplie's commands:

1. !join #channel - causes the bot to join and remember the channel

2. !part #channel - part and forget channel

3. !reload - causes reload of the bot code, useful for development

4. !set path value - set a config setting to the specified value. Examples
    
       !set ai.sleep.1 10 - Set the upper sleep limit to 10 seconds
       !set ai.sleep [2,3] - Set both sleep limits. The value must not contain spaces.

5. !get path - get the config value at the specified path

6. !db stats - triplie will output database statistics

TODO: !cmd set the option silently. !!cmd confirm the command 

# LICENCE & AUTHOR

See LICENCE and AUTHORS (if present)

Thank you for downloading it! Have fun!
spion, FreeNode@#triplie
